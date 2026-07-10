import { Monitor, Wifi, Code2, Database, Cpu, GitBranch, Lock, Terminal, CircuitBoard, Package, Server, Layers, BrainCircuit } from 'lucide-react'

// MCQ topic METADATA only. `questions` load from Supabase on demand
// (see contentLoader.js), keyed by `id` == DB category_slug.
export const TOPICS = [
  { id: 'computer_fundamental',  module: 'mcq', name: 'Computer Fundamentals',        shortName: 'Comp. Fund.',    icon: Monitor,       color: '#22d3ee', questions: [] },
  { id: 'c_programming',         module: 'mcq', name: 'C Programming',                 shortName: 'C Lang',         icon: Code2,         color: '#fb923c', questions: [] },
  { id: 'dsa',                   module: 'mcq', name: 'Data Structures & Algorithms',  shortName: 'DSA',            icon: GitBranch,     color: '#a78bfa', questions: [] },
  { id: 'database',              module: 'mcq', name: 'Database Systems',              shortName: 'Database',       icon: Database,      color: '#34d399', questions: [] },
  { id: 'digital_logic',         module: 'mcq', name: 'Digital Logic',                 shortName: 'Digital Logic',  icon: CircuitBoard,  color: '#fbbf24', questions: [] },
  { id: 'oop',                   module: 'mcq', name: 'Object Oriented Programming',   shortName: 'OOP',            icon: Package,       color: '#f472b6', questions: [] },
  { id: 'operating_system',      module: 'mcq', name: 'Operating Systems',             shortName: 'OS',             icon: Server,        color: '#60a5fa', questions: [] },
  { id: 'computer_network',      module: 'mcq', name: 'Computer Networks',             shortName: 'Networks',       icon: Wifi,          color: '#38bdf8', questions: [] },
  { id: 'information_security',  module: 'mcq', name: 'Information Security',          shortName: 'Info. Sec.',     icon: Lock,          color: '#f87171', questions: [] },
  { id: 'linux',                 module: 'mcq', name: 'Linux',                         shortName: 'Linux',          icon: Terminal,      color: '#86efac', questions: [] },
  { id: 'microprocessor',        module: 'mcq', name: 'Microprocessor',               shortName: 'Microproc.',     icon: Cpu,           color: '#c084fc', questions: [] },
  { id: 'software_engineering',  module: 'mcq', name: 'Software Engineering',          shortName: 'Soft. Eng.',     icon: Layers,        color: '#4ade80', questions: [] },
  { id: 'machine_learning',      module: 'mcq', name: 'Machine Learning',              shortName: 'ML',             icon: BrainCircuit,  color: '#e879f9', questions: [] },
  { id: 'theory_of_computation', module: 'mcq', name: 'Theory of Computation',         shortName: 'ToC',            icon: Layers,        color: '#fb7185', questions: [] },
]
