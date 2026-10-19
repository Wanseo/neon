import type { cities } from '../poster-layout'

type CityName = (typeof cities)[number]['city']

// Editorial museum selections, with official institution links.
export const cityInfo: Record<CityName, { timeZone: string; museum: string; url: string }> = {
  Seoul: { timeZone: 'Asia/Seoul', museum: 'MMCA Seoul', url: 'https://www.mmca.go.kr/eng/visitingInfo/seoulInfo.do' },
  Florence: { timeZone: 'Europe/Rome', museum: 'Uffizi Gallery', url: 'https://www.uffizi.it/en/the-uffizi' },
  Bremen: { timeZone: 'Europe/Berlin', museum: 'Kunsthalle Bremen', url: 'https://www.kunsthalle-bremen.de/' },
  London: { timeZone: 'Europe/London', museum: 'Tate Modern', url: 'https://www.tate.org.uk/visit/tate-modern' },
  Berlin: { timeZone: 'Europe/Berlin', museum: 'Neue Nationalgalerie', url: 'https://www.smb.museum/en/museums-institutions/neue-nationalgalerie/home/' },
  Amsterdam: { timeZone: 'Europe/Amsterdam', museum: 'Rijksmuseum', url: 'https://www.rijksmuseum.nl/en/visit' },
  Tilburg: { timeZone: 'Europe/Amsterdam', museum: 'De Pont Museum', url: 'https://www.depont.nl/en/' },
  NewYork: { timeZone: 'America/New_York', museum: 'MoMA', url: 'https://www.moma.org/visit/' },
  Paris: { timeZone: 'Europe/Paris', museum: 'Musée du Louvre', url: 'https://www.louvre.fr/en' },
  Heidelberg: { timeZone: 'Europe/Berlin', museum: 'Kurpfälzisches Museum', url: 'https://www.museum-heidelberg.de/' },
  Brussels: { timeZone: 'Europe/Brussels', museum: 'Royal Museums of Fine Arts of Belgium', url: 'https://fine-arts-museum.be/en' },
  Stuttgart: { timeZone: 'Europe/Berlin', museum: 'Staatsgalerie Stuttgart', url: 'https://www.staatsgalerie.de/en/' },
  Sydney: { timeZone: 'Australia/Sydney', museum: 'Art Gallery of New South Wales', url: 'https://www.artgallery.nsw.gov.au/' },
}
