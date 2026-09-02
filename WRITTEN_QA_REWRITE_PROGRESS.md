# Written Q&A — Full Rewrite Progress

Rewriting **every** written answer to the to-the-point style locked in on 2026-09-02.
Rules live in `WRITTEN_QA_PLAN.md` §3.1 (one idea per line) and §7.1 (one diagram per topic, inline).

## What each rewrite must do

1. **Split every dense line.** A `{sub}` that names more than one condition, or joins
   actions with "এবং"/"তারপর"/a semicolon list, becomes one line per condition/action.
2. **Multi-topic answers get per-topic inline diagrams** — `{diagram, label}` point items
   placed right after that topic's own points, instead of one combined `diagram` at the end.
3. **Never touch the `q` text** — the uid is a hash of it, and changing it orphans the
   question's Important/Nailed flags.
4. Keep every fact. This is a restructure, not a trim — no information may be lost.
5. `summary`, `table`, `mistakes`, `mnemonic` stay as they are unless they're dense too.

## Legend

- `[ ]` pending &nbsp;&nbsp; `[x]` rewritten &nbsp;&nbsp; `[-]` checked, already clean (no change needed)
- `dense` = lines flagged as cramming multiple ideas (the thing being fixed)

## Overall: 0 / 145 done  (97 need a rewrite, 48 already clean)

### c_programming — 7 questions, 6 need work

- [ ] `c_001` — 1 dense — Describe Dynamic Memory Allocation in C programming.
- [-] `c_002` — clean — What is Nested Structure in C programming? Explain with exam
- [ ] `c_003` — 5 dense, combined diagram → split inline — Consider the following Java program and determine the intege
- [ ] `c_004` — 13 dense — Time Complexity: analyze the common loop and recursion patte
- [ ] `c_005` — 11 dense — Pointer Arithmetic ও Memory Management — array address আর le
- [ ] `c_006` — 2 dense — C++ Inheritance ও Polymorphism — constructor call-এর ক্রম (c
- [ ] `c_007` — 8 dense — static variable বনাম parameter — recursive function-এর outpu

### computer_fundamental — 4 questions, 2 need work

- [-] `cf_001` — clean — A maintenance engineer is setting up a RAID 5 array with fiv
- [-] `cf_002` — clean — A bank's ATM network experiences an average of 4 hours of do
- [ ] `cf_003` — 1 dense — You have 4 Hard Drives of 2TB each. Calculate usable storage
- [ ] `cf_004` — 4 dense — Explain the concepts of Reinforcement Learning (RL), Deep Le

### computer_network — 30 questions, 23 need work

- [-] `cn_001` — clean, combined diagram → split inline — Explain the logic of a Checksum. How is it used to verify da
- [-] `cn_002` — clean — Draw a network architecture for Bangladesh Bank placing Fire
- [ ] `cn_003` — 1 dense, combined diagram → split inline — Afsana sends email to Sinthia. Which application & transport
- [ ] `cn_004` — 6 dense, combined diagram → split inline — How do RIP, OSPF, and BGP compare for network routing?
- [-] `cn_005` — clean — Explain packet switching. A packet passes through 4 routers 
- [ ] `cn_006` — 2 dense — At which layer of the OSI model does a standard Router prima
- [ ] `cn_007` — 6 dense — What are the different types of transmission media used for 
- [ ] `cn_008` — 5 dense — Differentiate among TDM, FDM and WDM. How does TDM work?
- [-] `cn_009` — clean — What are the challenges in optimizing energy efficiency of d
- [-] `cn_010` — clean — Why does DNS primarily use UDP instead of TCP? Describe the 
- [ ] `cn_011` — 2 dense — What are SOAP and RESTful APIs in web services? State one ma
- [ ] `cn_012` — 1 dense — A company developed private communication software (VoIP) wh
- [ ] `cn_013` — 3 dense — What are the advantages and disadvantages of Net-Specific Ro
- [ ] `cn_014` — 3 dense — What is an IT Disaster Recovery Plan (DRP)? Propose a compre
- [ ] `cn_015` — 2 dense — Describe the security architecture (network flow) for a bank
- [ ] `cn_016` — 2 dense — What is a Data Center to Cloud Transformation Strategy? Desc
- [ ] `cn_017` — 3 dense — Compare SAS (Serial Attached SCSI) vs. SATA (Serial ATA). Wh
- [ ] `cn_018` — 2 dense — What is BIOS and how does it affect hardware maintenance and
- [ ] `cn_019` — 2 dense — What type of generator is best suited for a data center's co
- [ ] `cn_020` — 3 dense — Explain how OSPF (Open Shortest Path First) works for packet
- [ ] `cn_021` — 7 dense — How does TCP/IP Tunneling work? Explain its mechanism and re
- [ ] `cn_022` — 3 dense, combined diagram → split inline — Excessive broadcast traffic (broadcast storm) in a LAN — wha
- [-] `cn_023` — clean — A core router receives a packet with destination IP 192.168.
- [ ] `cn_024` — 1 dense — A corporate network pool experiences IP exhaustion due to a 
- [ ] `cn_025` — 3 dense — A satellite link has one-way propagation delay 250 ms and tr
- [ ] `cn_026` — 2 dense — Compare between TCP and UDP: their connection, reliability, 
- [ ] `cn_027` — 4 dense, combined diagram → split inline — 10Mbps bandwidth, average packet length 1500 bytes, what is 
- [ ] `cn_028` — 3 dense — Differentiate between TCP 3-way handshake and 4-way handshak
- [ ] `cn_029` — 11 dense, combined diagram → split inline — Differentiate among RIP, DVR (Distance Vector Routing), OSPF
- [-] `cn_030` — clean — Explain the working principle of Stop-and-Wait ARQ, Sliding 

### database — 10 questions, 7 need work

- [-] `db_001` — clean — What does the Consistency property in ACID guarantee during 
- [-] `db_002` — clean — Consider the relation Sales(sales_id, salesman, region, sale
- [ ] `db_003` — 1 dense, combined diagram → split inline — What is ON DELETE CASCADE? What happens when it is used vs n
- [ ] `db_004` — 6 dense, combined diagram → split inline — Explain the distinct filtering behaviour of a WHERE clause v
- [ ] `db_005` — 2 dense — An IT department assigns employees to projects. An employee 
- [-] `db_006` — clean — In a B+ tree, each node can have a maximum of 4 child pointe
- [ ] `db_007` — 2 dense — Consider a concurrent transaction schedule involving two dat
- [ ] `db_008` — 10 dense — What is JDBC? Explain the steps required to connect a Java a
- [ ] `db_009` — 4 dense, combined diagram → split inline — An institute wants to create a database table named STUDENT.
- [ ] `db_010` — 3 dense, combined diagram → split inline — How indexing improve query performance?

### digital_logic — 2 questions, 2 need work

- [ ] `dl_001` — 5 dense, combined diagram → split inline — Explain the working principle of a PN junction diode. Draw i
- [ ] `dl_002` — 3 dense, combined diagram → split inline — What is the difference between a Multiplexer and a Demultipl

### dsa — 18 questions, 8 need work

- [-] `dsa_001` — clean — Analyze the time complexity of Quicksort when all elements a
- [ ] `dsa_002` — 1 dense — Explain the logic of Bubble Sort. Why is it considered ineff
- [-] `dsa_003` — clean — Determine whether Graph-3 (u1–u6) and Graph-4 (v1–v6) are is
- [-] `dsa_004` — clean — Describe step-by-step how Binary Search locates a target val
- [ ] `dsa_005` — 1 dense, combined diagram → split inline — You have two stacks. Explain the logic required to implement
- [-] `dsa_006` — clean — Construct a logical argument explaining why a heuristic sear
- [ ] `dsa_007` — 4 dense — Compare Dynamic Programming (DP) vs. Greedy Method vs. Divid
- [-] `dsa_008` — clean — Explain the time complexity of merge sort. Best, Average, Wo
- [-] `dsa_009` — clean, combined diagram → split inline — Why is a Circular Queue preferred over a Linear Queue in man
- [ ] `dsa_010` — 1 dense — How can you design and implement a Stack using two Queues?
- [-] `dsa_011` — clean — Given the array {45, 12, 78, 34, 23}, apply Bubble Sort in a
- [-] `dsa_012` — clean — A Max Heap contains 31 elements. Determine the height of the
- [ ] `dsa_013` — 4 dense — Which sorting algorithm is best for an already sorted array?
- [ ] `dsa_014` — 1 dense, combined diagram → split inline — A BST contains 1000 nodes. Find its minimum possible height,
- [-] `dsa_015` — clean, combined diagram → split inline — A message contains the characters with frequencies A = 30, B
- [-] `dsa_016` — clean — A hash table has size 10 and uses the hash function h(k) = k
- [ ] `dsa_017` — 2 dense, combined diagram → split inline — A hash table has size 13 and uses h(k) = k mod 13. Insert th
- [ ] `dsa_018` — 1 dense, combined diagram → split inline — Explain Adjacency Matrix and Adjacency List representations 

### information_security — 8 questions, 6 need work

- [-] `sec_001` — clean — Firewall rules - Rule 1: Source A, Dest B, Port 89. Rule 2: 
- [-] `sec_002` — clean, combined diagram → split inline — What are XSS (Cross-Site Scripting), CSRF (Cross-Site Reques
- [ ] `sec_003` — 5 dense — A bank has two different payment gateway service providers. 
- [ ] `sec_004` — 4 dense — What is a firewall? What is the difference between a Statefu
- [ ] `sec_005` — 2 dense — What security technologies and tools are needed for a secure
- [ ] `sec_006` — 6 dense, combined diagram → split inline — What is Cross-Site Scripting (XSS)? Differentiate Reflected 
- [ ] `sec_007` — 3 dense, combined diagram → split inline — Explain the operational difference between Hashing and Encry
- [ ] `sec_008` — 5 dense — Differentiate between a Computer Virus and a Computer Worm b

### linux — 1 questions, 1 need work

- [ ] `linux_001` — 5 dense — A high-traffic web application suddenly begins failing with 

### machine_learning — 4 questions, 2 need work

- [-] `ml_001` — clean — Suppose your dataset has missing values and noise. How would
- [-] `ml_002` — clean — What is a Decision Tree in Machine Learning? Describe its st
- [ ] `ml_003` — 1 dense — What is a heuristic function? Explain its role in the A* sea
- [ ] `ml_004` — 1 dense — What is a Bayesian Network in AI? Describe its two main comp

### microprocessor — 1 questions, 1 need work

- [ ] `mp_001` — 1 dense — Why do modern processor designs favor multistage pipeline ap

### oop — 4 questions, 2 need work

- [-] `oop_001` — clean — Write a Java program to represent a BankAccount class with d
- [ ] `oop_002` — 4 dense — Difference between Exception and Error in Java.
- [-] `oop_003` — clean — What is Exception Handling? Explain with example in Java.
- [ ] `oop_004` — 4 dense, combined diagram → split inline — Explain the concepts of Inheritance and Polymorphism in Java

### operating_system — 12 questions, 8 need work

- [ ] `os_001` — 2 dense — Explain Paging vs. Framing vs. Segmentation in Operating Sys
- [-] `os_002` — clean — In an office with 50-70 employees, what is Active Directory,
- [ ] `os_003` — 2 dense — Differentiate between Logical Address and Physical Address i
- [-] `os_004` — clean — Briefly explain 'Circular Wait.' In a Resource Allocation Gr
- [-] `os_005` — clean — Consider a logical address space of 512 pages, each of 2-KB 
- [ ] `os_006` — 4 dense — Explain the fundamental difference between a Process and a T
- [ ] `os_007` — 3 dense — Explain the Producer-Consumer problem in operating systems. 
- [ ] `os_008` — 2 dense — What is Multithreading programming? Why is Multithreading us
- [ ] `os_009` — 5 dense — Differentiate a process from a thread regarding memory space
- [ ] `os_010` — 2 dense, combined diagram → split inline — Two separate threads are initialized with the exact same ins
- [-] `os_011` — clean — A system utilizes a 32-bit logical address space and a page 
- [ ] `os_012` — 1 dense, combined diagram → split inline — Explain the difference between a "Compulsory Miss" (Cold Mis

### server — 36 questions, 23 need work

- [-] `server_001` — clean — What are the differences between a Virtual Machine (VM) and 
- [-] `server_002` — clean — What are the Pros and Cons of Virtual Machines and Container
- [ ] `server_003` — 3 dense, combined diagram → split inline — Differences between Tower Server, Rack Server, and Blade Ser
- [ ] `server_004` — 1 dense, combined diagram → split inline — What is ECC memory? Why is it needed, and where is it NOT ne
- [-] `server_005` — clean, combined diagram → split inline — KVM vs VMware — what is the difference, and which is better 
- [-] `server_006` — clean — What is Kubernetes? Explain its architecture.
- [ ] `server_007` — 1 dense, combined diagram → split inline — Docker vs Kubernetes — what is the difference, and how are t
- [ ] `server_008` — 6 dense — NAS vs SAN vs DAS — what is the difference, and which is use
- [ ] `server_009` — 4 dense — Explain Data Center Networking technology (topologies and ke
- [ ] `server_010` — 2 dense — What is SDN (Software Defined Networking)? Why is it needed,
- [-] `server_011` — clean — What is a Load Balancer? Explain static vs dynamic load bala
- [ ] `server_012` — 2 dense — Kubernetes vs OpenShift — what is each, and how do they diff
- [-] `server_013` — clean — What is Infrastructure as Code (IaC)? Why is it needed?
- [ ] `server_014` — 1 dense — What is the ELK Stack? Explain its components.
- [ ] `server_015` — 1 dense — Microservices vs Monolithic architecture — what is each, and
- [ ] `server_016` — 3 dense — What are RTO, RPO, and Failover in disaster recovery?
- [-] `server_017` — clean — Explain the Spine-Leaf network architecture.
- [ ] `server_018` — 4 dense — Snapshots vs Backup vs Replicas — what is each, and how do t
- [-] `server_019` — clean — Explain the VM (Virtual Machine) Lifecycle.
- [ ] `server_020` — 1 dense — Explain the common Storage Protocols (iSCSI, Fibre Channel, 
- [ ] `server_021` — 1 dense — Explain the CI/CD and DevOps pipeline (Code → Build → Test →
- [ ] `server_022` — 2 dense — Explain Live Migration (basic idea) and High Availability in
- [ ] `server_023` — 1 dense — What is a LUN (Logical Unit Number)? Why is it needed?
- [ ] `server_024` — 3 dense — What are the types of Disaster Recovery sites (Hot, Warm, Co
- [ ] `server_025` — 3 dense — Backup types — Full vs Incremental vs Differential.
- [ ] `server_026` — 3 dense — OLTP vs OLAP — what is each, and how do they differ?
- [ ] `server_027` — 1 dense — What is Active Directory and the Domain Controller concept?
- [ ] `server_028` — 2 dense — What is the role of DNS in Active Directory?
- [-] `server_029` — clean — What is Group Policy (GPO)? Explain the basic idea.
- [ ] `server_030` — 6 dense — What are the Data Center Tiers (Tier I, II, III, IV)? Explai
- [-] `server_031` — clean, combined diagram → split inline — Draw and explain the DMZ (Demilitarized Zone) network archit
- [-] `server_032` — clean — Draw the placement of a Web server, WAF (Web Application Fir
- [-] `server_033` — clean — Draw the VPN architecture — Site-to-Site vs Remote Access.
- [-] `server_034` — clean — Draw a High Availability (HA) failover cluster (heartbeat + 
- [ ] `server_035` — 3 dense — A startup company wants to launch a new web application. The
- [ ] `server_036` — 4 dense, combined diagram → split inline — A physical server has 32 CPU cores, 96 GB RAM, and 4 TB stor

### software_engineering — 7 questions, 5 need work

- [-] `se_001` — clean, combined diagram → split inline — You have been hired as a Cloud Data Engineer to design a big
- [-] `se_002` — clean — Distinguish between Preventive and Corrective maintenance wi
- [ ] `se_003` — 3 dense — What is SCRUM? Explain its key elements and describe the SCR
- [ ] `se_004` — 3 dense — What is the difference between Software Validation and Softw
- [ ] `se_005` — 4 dense — Compare Agile vs. Waterfall vs. Spiral SDLC models — coverin
- [ ] `se_006` — 4 dense, combined diagram → split inline — Identify the most suitable SDLC model for an Online Library 
- [ ] `se_007` — 9 dense, combined diagram → split inline — Write concepts of coupling and cohesion with example?

### theory_of_computation — 1 questions, 1 need work

- [ ] `toc_001` — 3 dense, combined diagram → split inline — Consider the grammar: E → E + E | E * E | id. Show that the 

