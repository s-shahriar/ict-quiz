import computerFundamental from './computer_fundamental.json'
import operatingSystem from './operating_system.json'
import dsa from './dsa.json'
import computerNetwork from './computer_network.json'
import informationSecurity from './information_security.json'
import softwareEngineering from './software_engineering.json'
import microprocessor from './microprocessor.json'
import database from './database.json'

const WRITTEN_DATA = {
  computer_fundamental: computerFundamental,
  operating_system: operatingSystem,
  dsa: dsa,
  computer_network: computerNetwork,
  information_security: informationSecurity,
  software_engineering: softwareEngineering,
  microprocessor: microprocessor,
  database: database,
}

export function getWrittenData(topicId) {
  return WRITTEN_DATA[topicId] || { category: topicId, questions: [] }
}

export function getWrittenCount(topicId) {
  return WRITTEN_DATA[topicId]?.questions?.length || 0
}
