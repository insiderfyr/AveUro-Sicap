import React, { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { Text, Box } from "ink"
import prettyMs from "pretty-ms"
import Spinner from "ink-spinner"
import es from "@elastic/elasticsearch"
import PromisePool from "@supercharge/promise-pool"

import { Container, Error, Progress } from "../components"
import { checkDate, getDurationInMilliseconds, yesterday } from "../lib/utils"
import { getAll, getPublicNotice, getPublicNoticeContracts } from "../lib/sicap-api.js"
import { transformItem, transformPublicNotice, transformNoticeContracts } from "../lib/transformers.js"

const start = process.hrtime()

/// Indexeaza licitatiile publice
function Licitatii({ date, host, index, concurrency, archive }) {
  const client = new es.Client({ node: host, 
    tls: {
      rejectUnauthorized: false,
    },
  })

  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isLoading, setLoading] = useState(false)

  const error = checkDate(date)

  const processDay = async () => {
    const [dd, mm, yyyy] = date.split("-")
    setLoading(true)
    const noticeList = await getAll(`${yyyy}-${mm}-${dd}`, { istoric: archive })
    
    // FILTRU: Aici poți adăuga logica de filtrare
    const filteredItems = noticeList.items.filter(item => {
      // 1. Filtrare după valoarea contractului (peste 100,000 RON)
      if (item.ronContractValue < 100000) return false;

      // 2. Extragere și normalizare date
      const cpvCode = item.cpvCodeAndName?.split(" - ")[0]?.trim() || "";
      const cpvDescription = item.cpvCodeAndName?.toLowerCase() || "";
      const contractTitle = item.contractTitle?.toLowerCase() || "";
      const contractObject = item.contractObject?.toLowerCase() || "";
      
      // Text complet pentru căutare
      const fullText = [cpvDescription, contractTitle, contractObject].join(" ");

      // 3. CPV CODES SPECIFICE - doar pentru vehiculele și stațiile noastre
      const specificCpvCodes = [
        // AUTOBUZE ELECTRICE
        "34144910", "34144910-0", "34144910-1", "34144910-2", "34144910-3",
        "34121100-2", "34121100-3", // Autobuze servicii publice
        
        // MICROBUZE ELECTRICE  
        "34114400-3", "34114400-4", // Microbuze specifice
        
        // STAȚII DE ÎNCĂRCARE ELECTRICE
        "31681500-7", "31681500-8", // Stații încărcare vehicule electrice
        "31162000-5", "31162000-6", // Echipamente încărcare baterii
        "45316100-2", // Instalare echipamente electrice pentru stații
      ];

      const cpvMatch = specificCpvCodes.some(code => 
        cpvCode === code || cpvCode.startsWith(code.split('-')[0])
      );

      // 4. KEYWORDS PRECISE - doar termenii exacti
      const preciseKeywords = [
        // === AUTOBUZE ELECTRICE ===
        "autobuz electric", "autobuze electrice", "autobuzul electric", "autobuzelor electrice",
        "autobuze cu propulsie electrica", "autobuze cu baterii", "autobuze zero emisii",
        
        // === MICROBUZE ELECTRICE ===
        "microbuz electric", "microbuze electrice", "microbuzul electric", "microbuzelor electrice", 
        "microbuze cu propulsie electrica", "microbuze cu baterii", "microbuze zero emisii",
        
        // === STAȚII DE ÎNCĂRCARE ELECTRICE ===
        "statie de incarcare", "statii de incarcare", "stație de încărcare", "stații de încărcare",
        "statie de incarcare electrica", "statii de incarcare electrice", 
        "stație de încărcare electrică", "stații de încărcare electrice",
        "punct de incarcare electric", "puncte de incarcare electrice",
        "punct de încărcare electric", "puncte de încărcare electrice",
        "terminal de incarcare electric", "terminale de incarcare electrice",
        "echipament de incarcare electric", "echipamente de incarcare electrice",
        "aparate de reincarcare electric", "aparate de încărcare electrice",
        
        // === ENGLISH SPECIFIC ===
        "electric bus", "electric buses", "electric minibus", "electric minibuses",
        "electric charging station", "electric charging stations", "ev charging station",
        "charging station for electric vehicles", "electric vehicle charging point",
      ];

      // 5. PATTERN MATCHING FOARTE SPECIFIC
      const specificPatterns = [
        // Autobuze + electric în orice ordine
        /\bautobuz(e|ul|elor)?\b.*\belectric(e|a)?\b/i,
        /\belectric(e|a)?\b.*\bautobuz(e|ul|elor)?\b/i,
        
        // Microbuze + electric în orice ordine
        /\bmicrobuz(e|ul|elor)?\b.*\belectric(e|a)?\b/i,
        /\belectric(e|a)?\b.*\bmicrobuz(e|ul|elor)?\b/i,
        
        // Stații de încărcare (cu toate variantele de diacritice)
        /\bstat(ie|ii)\b.*\b(incarcare|încărcare)\b.*\belectric(e|a)?\b/i,
        /\bpunct(e)?\b.*\b(incarcare|încărcare)\b.*\belectric(e|a)?\b/i,
        /\bterminal(e)?\b.*\b(incarcare|încărcare)\b.*\belectric(e|a)?\b/i,
        /\b(incarcare|încărcare)\b.*\belectric(e|a)?\b.*\bvehicul(e|elor)?\b/i,
        
        // Infrastructură pentru vehicule electrice
        /\binfrastructura\b.*\b(incarcare|încărcare)\b.*\belectric(e|a)?\b/i,
        /\bechipament(e)?\b.*\b(incarcare|încărcare)\b.*\belectric(e|a)?\b/i,
      ];

      const patternMatch = specificPatterns.some(pattern => pattern.test(fullText));

      // 6. VERIFICARE KEYWORD EXACTĂ
      const keywordMatch = preciseKeywords.some(keyword => fullText.includes(keyword));

      // 7. COMBINAȚIE LOGICĂ PENTRU MAXIMĂ PRECIZIE
      // Trebuie să fie cel puțin una dintre:
      // - CPV code exact pentru domeniile noastre
      // - Keyword exact găsit
      // - Pattern specific găsit
      const finalMatch = cpvMatch || keywordMatch || patternMatch;

      // 8. FILTRU DE EXCLUDERE - eliminăm false positive-urile
      const excludePatterns = [
        /\bdiesel\b/i, /\bgaz\b/i, /\bcng\b/i, /\blpg\b/i, // combustibili fosili
        /\bhibrid(?!.*electric)/i, // hibrid fără electric
        /\bconventional/i, /\btermice?\b/i, // motoare termice
        /\bservice\b.*\bmaintenance\b/i, // doar service, fără achiziție
      ];

      const shouldExclude = excludePatterns.some(pattern => pattern.test(fullText));

      // Rezultat final: match pozitiv și nu e exclus
      return finalMatch && !shouldExclude;
    })
    
    setTotal(filteredItems.length)
    setLoading(false)

    await new PromisePool()
      .for(filteredItems)
      .withConcurrency(concurrency)
      .process(async (item) => {
        const { caNoticeId } = item
        const [publicNotice, noticeContracts] = await Promise.all([
          getPublicNotice(caNoticeId, { date, istoric: archive }),
          getPublicNoticeContracts(caNoticeId, { date, istoric: archive }),
        ])

        await client
          .update({
            id: caNoticeId,
            index,
            body: {
              doc: {
                item: transformItem(item),
                publicNotice: transformPublicNotice(publicNotice),
                noticeContracts: transformNoticeContracts(noticeContracts),
                istoric: archive,
              },
              doc_as_upsert: true,
            },
          })
          .catch((error) => {
            console.error(error)
            console.info(`-----> UPDATE ERROR ON: [${caNoticeId} \n`, error.meta.body.error)
            process.exit(1)
          })

        setElapsed(prettyMs(getDurationInMilliseconds(start), { secondsDecimalDigits: 0 }))
        setCurrent((c) => c + 1)
      })
  }

  useEffect(() => {
    processDay()
  }, [])

  const percent = current / total || 0
  return (
    <Container>
      {error ? (
        <Error text={error} />
      ) : (
        <Box>
          <Text>{date} | </Text>
          <Progress percent={percent} />
          <Box marginLeft={2}>
            <Text>
              {`| ${Math.round(percent * 100)}% | `}
              {current}/
              {!isLoading ? (
                total
              ) : (
                <Text color="green">
                  <Spinner type="dots" />
                </Text>
              )}{" "}
              | {elapsed}
            </Text>
          </Box>
        </Box>
      )}
    </Container>
  )
}

Licitatii.propTypes = {
  /// Data in format zz-ll-aaaa - default ziua precedenta
  date: PropTypes.string,
  /// Url Elasticsearch (default localhost:9200)
  host: PropTypes.string,
  /// Indexul Elasticsearch folosit pentru licitatiile publice (default licitatii-publice)
  index: PropTypes.string,
  /// Numarul de accesari concurente spre siteul SEAP (default 5)
  concurrency: PropTypes.number,
  /// foloseste arhiva istorica (baza de date 2007-218)
  archive: PropTypes.bool,
}

Licitatii.defaultProps = {
  host: "http://localhost:9200",
  index: "licitatii-publice",
  concurrency: 5,
  archive: false,
  date: yesterday(),
}

Licitatii.shortFlags = {
  date: "d",
  host: "h",
  index: "i",
  concurrency: "c",
  archive: "a",
}

export default Licitatii
