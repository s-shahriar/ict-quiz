import { Monitor, Wifi, Code2, Database, Cpu, GitBranch, Lock, Terminal, CircuitBoard, Package, Server, Layers } from 'lucide-react'

import computerFundamental from './computer_fundamental.json'
import computerNetwork from './computer_network.json'
import cProgramming from './c_programming.json'
import database from './database.json'
import digitalLogic from './digital_logic.json'
import dsa from './dsa.json'
import informationSecurity from './information_security.json'
import linux from './linux.json'
import microprocessor from './microprocessor.json'
import oop from './oop.json'
import operatingSystem from './operating_system.json'
import softwareEngineering from './software_engineering.json'

export const TOPICS = [
  {
    id: 'computer_fundamental',
    name: 'Computer Fundamentals',
    shortName: 'Comp. Fund.',
    icon: Monitor,
    color: '#22d3ee',
    questions: computerFundamental.questions || [],
  },
  {
    id: 'c_programming',
    name: 'C Programming',
    shortName: 'C Lang',
    icon: Code2,
    color: '#fb923c',
    questions: cProgramming.questions || [],
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    icon: GitBranch,
    color: '#a78bfa',
    questions: dsa.questions || [],
  },
  {
    id: 'database',
    name: 'Database Systems',
    shortName: 'Database',
    icon: Database,
    color: '#34d399',
    questions: database.questions || [],
  },
  {
    id: 'digital_logic',
    name: 'Digital Logic',
    shortName: 'Digital Logic',
    icon: CircuitBoard,
    color: '#fbbf24',
    questions: digitalLogic.questions || [],
  },
  {
    id: 'oop',
    name: 'Object Oriented Programming',
    shortName: 'OOP',
    icon: Package,
    color: '#f472b6',
    questions: oop.questions || [],
  },
  {
    id: 'operating_system',
    name: 'Operating Systems',
    shortName: 'OS',
    icon: Server,
    color: '#60a5fa',
    questions: operatingSystem.questions || [],
  },
  {
    id: 'computer_network',
    name: 'Computer Networks',
    shortName: 'Networks',
    icon: Wifi,
    color: '#38bdf8',
    questions: computerNetwork.questions || [],
  },
  {
    id: 'information_security',
    name: 'Information Security',
    shortName: 'Info. Sec.',
    icon: Lock,
    color: '#f87171',
    questions: informationSecurity.questions || [],
  },
  {
    id: 'linux',
    name: 'Linux',
    shortName: 'Linux',
    icon: Terminal,
    color: '#86efac',
    questions: linux.questions || [],
  },
  {
    id: 'microprocessor',
    name: 'Microprocessor',
    shortName: 'Microproc.',
    icon: Cpu,
    color: '#c084fc',
    questions: microprocessor.questions || [],
  },
  {
    id: 'software_engineering',
    name: 'Software Engineering',
    shortName: 'Soft. Eng.',
    icon: Layers,
    color: '#4ade80',
    questions: softwareEngineering.questions || [],
  },
]
