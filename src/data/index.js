import { Monitor, Wifi, Code2, Database, Cpu, GitBranch, Lock, Terminal, CircuitBoard, Package, Server, Layers, BrainCircuit } from 'lucide-react'

// MCQ topic METADATA only. `questions` load from Supabase on demand
// (see contentLoader.js), keyed by `id` == DB category_slug.
export const TOPICS = [
  { id: 'computer_fundamental',  module: 'mcq', name: 'Computer Fundamentals',        shortName: 'Comp. Fund.',    icon: Monitor,       color: 'var(--topic-7)', questions: [] },
  { id: 'c_programming',         module: 'mcq', name: 'C Programming',                 shortName: 'C Lang',         icon: Code2,         color: 'var(--topic-2)', questions: [] },
  { id: 'dsa',                   module: 'mcq', name: 'Data Structures & Algorithms',  shortName: 'DSA',            icon: GitBranch,     color: 'var(--topic-10)', questions: [] },
  { id: 'database',              module: 'mcq', name: 'Database Systems',              shortName: 'Database',       icon: Database,      color: 'var(--topic-6)', questions: [] },
  { id: 'digital_logic',         module: 'mcq', name: 'Digital Logic',                 shortName: 'Digital Logic',  icon: CircuitBoard,  color: 'var(--topic-3)', questions: [] },
  { id: 'oop',                   module: 'mcq', name: 'Object Oriented Programming',   shortName: 'OOP',            icon: Package,       color: 'var(--topic-12)', questions: [] },
  { id: 'operating_system',      module: 'mcq', name: 'Operating Systems',             shortName: 'OS',             icon: Server,        color: 'var(--topic-9)', questions: [] },
  { id: 'computer_network',      module: 'mcq', name: 'Computer Networks',             shortName: 'Networks',       icon: Wifi,          color: 'var(--topic-8)', questions: [] },
  { id: 'information_security',  module: 'mcq', name: 'Information Security',          shortName: 'Info. Sec.',     icon: Lock,          color: 'var(--topic-1)', questions: [] },
  { id: 'linux',                 module: 'mcq', name: 'Linux',                         shortName: 'Linux',          icon: Terminal,      color: 'var(--topic-4)', questions: [] },
  { id: 'microprocessor',        module: 'mcq', name: 'Microprocessor',               shortName: 'Microproc.',     icon: Cpu,           color: 'var(--topic-10)', questions: [] },
  { id: 'software_engineering',  module: 'mcq', name: 'Software Engineering',          shortName: 'Soft. Eng.',     icon: Layers,        color: 'var(--topic-5)', questions: [] },
  { id: 'machine_learning',      module: 'mcq', name: 'Machine Learning',              shortName: 'ML',             icon: BrainCircuit,  color: 'var(--topic-11)', questions: [] },
  { id: 'theory_of_computation', module: 'mcq', name: 'Theory of Computation',         shortName: 'ToC',            icon: Layers,        color: 'var(--topic-1)', questions: [] },
]
