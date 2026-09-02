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

- `[x]` rewritten &nbsp;&nbsp; `[ ]` still has dense lines &nbsp;&nbsp; `[-]` was already clean, left alone
- `dense` = lines cramming multiple ideas (the thing being fixed)

## Status: ✅ **complete — 127 of 145 answers rewritten**

The remaining 18 were read and left as-is: already one idea per line.
Two lines (`server_003` Space:, `server_024` Hot/Warm/Cold) keep their semicolons on purpose —
they are single three-way comparisons, which §3.1 explicitly allows.

### c_programming — 7 questions — ✅ all 6 rewritten

- [x] `c_001` — was 1 dense → now 25 clean points — Describe Dynamic Memory Allocation in C programming.
- [-] `c_002` — already clean — What is Nested Structure in C programming? Explain with exam
- [x] `c_003` — was 5 dense → now 30 clean points, 5 inline diagram(s) — Consider the following Java program and determine the intege
- [x] `c_004` — was 13 dense → now 70 clean points — Time Complexity: analyze the common loop and recursion patte
- [x] `c_005` — was 11 dense → now 103 clean points — Pointer Arithmetic ও Memory Management — array address আর le
- [x] `c_006` — was 2 dense → now 17 clean points — C++ Inheritance ও Polymorphism — constructor call-এর ক্রম (c
- [x] `c_007` — was 8 dense → now 45 clean points — static variable বনাম parameter — recursive function-এর outpu

### computer_fundamental — 4 questions — ✅ all 2 rewritten

- [-] `cf_001` — already clean — A maintenance engineer is setting up a RAID 5 array with fiv
- [-] `cf_002` — already clean — A bank's ATM network experiences an average of 4 hours of do
- [x] `cf_003` — was 1 dense → now 25 clean points, 3 inline diagram(s) — You have 4 Hard Drives of 2TB each. Calculate usable storage
- [x] `cf_004` — was 4 dense → now 21 clean points, 3 inline diagram(s) — Explain the concepts of Reinforcement Learning (RL), Deep Le

### computer_network — 30 questions — ✅ all 23 rewritten

- [-] `cn_001` — already clean — Explain the logic of a Checksum. How is it used to verify da
- [-] `cn_002` — already clean — Draw a network architecture for Bangladesh Bank placing Fire
- [x] `cn_003` — was 1 dense → now 18 clean points — Afsana sends email to Sinthia. Which application & transport
- [x] `cn_004` — was 6 dense → now 26 clean points, 3 inline diagram(s) — How do RIP, OSPF, and BGP compare for network routing?
- [-] `cn_005` — already clean — Explain packet switching. A packet passes through 4 routers 
- [x] `cn_006` — was 2 dense → now 17 clean points — At which layer of the OSI model does a standard Router prima
- [x] `cn_007` — was 6 dense → now 26 clean points — What are the different types of transmission media used for 
- [x] `cn_008` — was 5 dense → now 28 clean points, 4 inline diagram(s) — Differentiate among TDM, FDM and WDM. How does TDM work?
- [-] `cn_009` — already clean — What are the challenges in optimizing energy efficiency of d
- [-] `cn_010` — already clean — Why does DNS primarily use UDP instead of TCP? Describe the 
- [x] `cn_011` — was 2 dense → now 18 clean points — What are SOAP and RESTful APIs in web services? State one ma
- [x] `cn_012` — was 1 dense → now 19 clean points — A company developed private communication software (VoIP) wh
- [x] `cn_013` — was 3 dense → now 24 clean points — What are the advantages and disadvantages of Net-Specific Ro
- [x] `cn_014` — was 3 dense → now 22 clean points — What is an IT Disaster Recovery Plan (DRP)? Propose a compre
- [x] `cn_015` — was 2 dense → now 17 clean points — Describe the security architecture (network flow) for a bank
- [x] `cn_016` — was 2 dense → now 27 clean points — What is a Data Center to Cloud Transformation Strategy? Desc
- [x] `cn_017` — was 3 dense → now 20 clean points — Compare SAS (Serial Attached SCSI) vs. SATA (Serial ATA). Wh
- [x] `cn_018` — was 2 dense → now 22 clean points — What is BIOS and how does it affect hardware maintenance and
- [x] `cn_019` — was 2 dense → now 19 clean points — What type of generator is best suited for a data center's co
- [x] `cn_020` — was 3 dense → now 18 clean points — Explain how OSPF (Open Shortest Path First) works for packet
- [x] `cn_021` — was 7 dense → now 31 clean points — How does TCP/IP Tunneling work? Explain its mechanism and re
- [x] `cn_022` — was 3 dense → now 33 clean points, 3 inline diagram(s) — Excessive broadcast traffic (broadcast storm) in a LAN — wha
- [-] `cn_023` — already clean — A core router receives a packet with destination IP 192.168.
- [x] `cn_024` — was 1 dense → now 19 clean points, 2 inline diagram(s) — A corporate network pool experiences IP exhaustion due to a 
- [x] `cn_025` — was 3 dense → now 25 clean points, 2 inline diagram(s) — A satellite link has one-way propagation delay 250 ms and tr
- [x] `cn_026` — was 2 dense → now 24 clean points, 2 inline diagram(s) — Compare between TCP and UDP: their connection, reliability, 
- [x] `cn_027` — was 4 dense → now 24 clean points, 2 inline diagram(s) — 10Mbps bandwidth, average packet length 1500 bytes, what is 
- [x] `cn_028` — was 3 dense → now 33 clean points, 2 inline diagram(s) — Differentiate between TCP 3-way handshake and 4-way handshak
- [x] `cn_029` — was 11 dense → now 66 clean points, 4 inline diagram(s) — Differentiate among RIP, DVR (Distance Vector Routing), OSPF
- [-] `cn_030` — already clean, 4 inline diagram(s) — Explain the working principle of Stop-and-Wait ARQ, Sliding 

### database — 10 questions — ✅ all 7 rewritten

- [-] `db_001` — already clean — What does the Consistency property in ACID guarantee during 
- [-] `db_002` — already clean — Consider the relation Sales(sales_id, salesman, region, sale
- [x] `db_003` — was 1 dense → now 21 clean points — What is ON DELETE CASCADE? What happens when it is used vs n
- [x] `db_004` — was 6 dense → now 21 clean points — Explain the distinct filtering behaviour of a WHERE clause v
- [x] `db_005` — was 2 dense → now 29 clean points — An IT department assigns employees to projects. An employee 
- [-] `db_006` — already clean — In a B+ tree, each node can have a maximum of 4 child pointe
- [x] `db_007` — was 2 dense → now 33 clean points — Consider a concurrent transaction schedule involving two dat
- [x] `db_008` — was 10 dense → now 46 clean points — What is JDBC? Explain the steps required to connect a Java a
- [x] `db_009` — was 4 dense → now 33 clean points — An institute wants to create a database table named STUDENT.
- [x] `db_010` — was 3 dense → now 38 clean points — How indexing improve query performance?

### digital_logic — 2 questions — ✅ all 2 rewritten

- [x] `dl_001` — was 5 dense → now 44 clean points, 5 inline diagram(s) — Explain the working principle of a PN junction diode. Draw i
- [x] `dl_002` — was 3 dense → now 33 clean points, 3 inline diagram(s) — What is the difference between a Multiplexer and a Demultipl

### dsa — 18 questions — ✅ all 8 rewritten

- [-] `dsa_001` — already clean — Analyze the time complexity of Quicksort when all elements a
- [x] `dsa_002` — was 1 dense → now 16 clean points — Explain the logic of Bubble Sort. Why is it considered ineff
- [-] `dsa_003` — already clean — Determine whether Graph-3 (u1–u6) and Graph-4 (v1–v6) are is
- [-] `dsa_004` — already clean — Describe step-by-step how Binary Search locates a target val
- [x] `dsa_005` — was 1 dense → now 21 clean points — You have two stacks. Explain the logic required to implement
- [-] `dsa_006` — already clean — Construct a logical argument explaining why a heuristic sear
- [x] `dsa_007` — was 4 dense → now 33 clean points, 3 inline diagram(s) — Compare Dynamic Programming (DP) vs. Greedy Method vs. Divid
- [-] `dsa_008` — already clean — Explain the time complexity of merge sort. Best, Average, Wo
- [-] `dsa_009` — already clean — Why is a Circular Queue preferred over a Linear Queue in man
- [x] `dsa_010` — was 1 dense → now 18 clean points — How can you design and implement a Stack using two Queues?
- [-] `dsa_011` — already clean — Given the array {45, 12, 78, 34, 23}, apply Bubble Sort in a
- [-] `dsa_012` — already clean — A Max Heap contains 31 elements. Determine the height of the
- [x] `dsa_013` — was 4 dense → now 28 clean points, 4 inline diagram(s) — Which sorting algorithm is best for an already sorted array?
- [x] `dsa_014` — was 1 dense → now 19 clean points — A BST contains 1000 nodes. Find its minimum possible height,
- [-] `dsa_015` — already clean — A message contains the characters with frequencies A = 30, B
- [-] `dsa_016` — already clean — A hash table has size 10 and uses the hash function h(k) = k
- [x] `dsa_017` — was 2 dense → now 23 clean points — A hash table has size 13 and uses h(k) = k mod 13. Insert th
- [x] `dsa_018` — was 1 dense → now 16 clean points — Explain Adjacency Matrix and Adjacency List representations 

### information_security — 8 questions — ✅ all 6 rewritten

- [-] `sec_001` — already clean — Firewall rules - Rule 1: Source A, Dest B, Port 89. Rule 2: 
- [-] `sec_002` — already clean, 4 inline diagram(s) — What are XSS (Cross-Site Scripting), CSRF (Cross-Site Reques
- [x] `sec_003` — was 5 dense → now 22 clean points, 1 inline diagram(s) — A bank has two different payment gateway service providers. 
- [x] `sec_004` — was 4 dense → now 25 clean points — What is a firewall? What is the difference between a Statefu
- [x] `sec_005` — was 2 dense → now 22 clean points — What security technologies and tools are needed for a secure
- [x] `sec_006` — was 6 dense → now 34 clean points, 2 inline diagram(s) — What is Cross-Site Scripting (XSS)? Differentiate Reflected 
- [x] `sec_007` — was 3 dense → now 33 clean points, 3 inline diagram(s) — Explain the operational difference between Hashing and Encry
- [x] `sec_008` — was 5 dense → now 37 clean points, 2 inline diagram(s) — Differentiate between a Computer Virus and a Computer Worm b

### linux — 1 questions — ✅ all 1 rewritten

- [x] `linux_001` — was 5 dense → now 26 clean points — A high-traffic web application suddenly begins failing with 

### machine_learning — 4 questions — ✅ all 2 rewritten

- [-] `ml_001` — already clean — Suppose your dataset has missing values and noise. How would
- [-] `ml_002` — already clean — What is a Decision Tree in Machine Learning? Describe its st
- [x] `ml_003` — was 1 dense → now 23 clean points — What is a heuristic function? Explain its role in the A* sea
- [x] `ml_004` — was 1 dense → now 20 clean points — What is a Bayesian Network in AI? Describe its two main comp

### microprocessor — 1 questions — ✅ all 1 rewritten

- [x] `mp_001` — was 1 dense → now 23 clean points — Why do modern processor designs favor multistage pipeline ap

### oop — 4 questions — ✅ all 2 rewritten

- [-] `oop_001` — already clean — Write a Java program to represent a BankAccount class with d
- [x] `oop_002` — was 4 dense → now 26 clean points — Difference between Exception and Error in Java.
- [-] `oop_003` — already clean — What is Exception Handling? Explain with example in Java.
- [x] `oop_004` — was 4 dense → now 34 clean points — Explain the concepts of Inheritance and Polymorphism in Java

### operating_system — 12 questions — ✅ all 8 rewritten

- [x] `os_001` — was 2 dense → now 21 clean points — Explain Paging vs. Framing vs. Segmentation in Operating Sys
- [-] `os_002` — already clean — In an office with 50-70 employees, what is Active Directory,
- [x] `os_003` — was 2 dense → now 19 clean points — Differentiate between Logical Address and Physical Address i
- [-] `os_004` — already clean — Briefly explain 'Circular Wait.' In a Resource Allocation Gr
- [-] `os_005` — already clean — Consider a logical address space of 512 pages, each of 2-KB 
- [x] `os_006` — was 4 dense → now 23 clean points — Explain the fundamental difference between a Process and a T
- [x] `os_007` — was 3 dense → now 24 clean points — Explain the Producer-Consumer problem in operating systems. 
- [x] `os_008` — was 2 dense → now 17 clean points — What is Multithreading programming? Why is Multithreading us
- [x] `os_009` — was 5 dense → now 19 clean points — Differentiate a process from a thread regarding memory space
- [x] `os_010` — was 2 dense → now 24 clean points — Two separate threads are initialized with the exact same ins
- [-] `os_011` — already clean — A system utilizes a 32-bit logical address space and a page 
- [x] `os_012` — was 1 dense → now 21 clean points — Explain the difference between a "Compulsory Miss" (Cold Mis

### server — 36 questions — ✅ all 23 rewritten

- [-] `server_001` — already clean — What are the differences between a Virtual Machine (VM) and 
- [-] `server_002` — already clean — What are the Pros and Cons of Virtual Machines and Container
- [x] `server_003` — kept 1 three-way comparison line on purpose (was 3 dense), 4 inline diagram(s) — Differences between Tower Server, Rack Server, and Blade Ser
- [x] `server_004` — was 1 dense → now 25 clean points — What is ECC memory? Why is it needed, and where is it NOT ne
- [-] `server_005` — already clean — KVM vs VMware — what is the difference, and which is better 
- [-] `server_006` — already clean — What is Kubernetes? Explain its architecture.
- [x] `server_007` — was 1 dense → now 22 clean points — Docker vs Kubernetes — what is the difference, and how are t
- [x] `server_008` — was 6 dense → now 32 clean points — NAS vs SAN vs DAS — what is the difference, and which is use
- [x] `server_009` — was 4 dense → now 44 clean points — Explain Data Center Networking technology (topologies and ke
- [x] `server_010` — was 2 dense → now 36 clean points — What is SDN (Software Defined Networking)? Why is it needed,
- [-] `server_011` — already clean — What is a Load Balancer? Explain static vs dynamic load bala
- [x] `server_012` — was 2 dense → now 24 clean points — Kubernetes vs OpenShift — what is each, and how do they diff
- [-] `server_013` — already clean — What is Infrastructure as Code (IaC)? Why is it needed?
- [x] `server_014` — was 1 dense → now 19 clean points — What is the ELK Stack? Explain its components.
- [x] `server_015` — was 1 dense → now 22 clean points — Microservices vs Monolithic architecture — what is each, and
- [x] `server_016` — was 3 dense → now 18 clean points — What are RTO, RPO, and Failover in disaster recovery?
- [-] `server_017` — already clean — Explain the Spine-Leaf network architecture.
- [x] `server_018` — was 4 dense → now 23 clean points — Snapshots vs Backup vs Replicas — what is each, and how do t
- [-] `server_019` — already clean — Explain the VM (Virtual Machine) Lifecycle.
- [x] `server_020` — was 1 dense → now 18 clean points — Explain the common Storage Protocols (iSCSI, Fibre Channel, 
- [x] `server_021` — was 1 dense → now 21 clean points — Explain the CI/CD and DevOps pipeline (Code → Build → Test →
- [x] `server_022` — was 2 dense → now 19 clean points — Explain Live Migration (basic idea) and High Availability in
- [x] `server_023` — was 1 dense → now 17 clean points — What is a LUN (Logical Unit Number)? Why is it needed?
- [x] `server_024` — kept 1 three-way comparison line on purpose (was 3 dense) — What are the types of Disaster Recovery sites (Hot, Warm, Co
- [x] `server_025` — was 3 dense → now 19 clean points — Backup types — Full vs Incremental vs Differential.
- [x] `server_026` — was 3 dense → now 22 clean points — OLTP vs OLAP — what is each, and how do they differ?
- [x] `server_027` — was 1 dense → now 20 clean points — What is Active Directory and the Domain Controller concept?
- [x] `server_028` — was 2 dense → now 20 clean points — What is the role of DNS in Active Directory?
- [-] `server_029` — already clean — What is Group Policy (GPO)? Explain the basic idea.
- [x] `server_030` — was 6 dense → now 31 clean points — What are the Data Center Tiers (Tier I, II, III, IV)? Explai
- [-] `server_031` — already clean — Draw and explain the DMZ (Demilitarized Zone) network archit
- [-] `server_032` — already clean — Draw the placement of a Web server, WAF (Web Application Fir
- [-] `server_033` — already clean — Draw the VPN architecture — Site-to-Site vs Remote Access.
- [-] `server_034` — already clean — Draw a High Availability (HA) failover cluster (heartbeat + 
- [x] `server_035` — was 3 dense → now 32 clean points — A startup company wants to launch a new web application. The
- [x] `server_036` — was 4 dense → now 24 clean points — A physical server has 32 CPU cores, 96 GB RAM, and 4 TB stor

### software_engineering — 7 questions — ✅ all 5 rewritten

- [-] `se_001` — already clean — You have been hired as a Cloud Data Engineer to design a big
- [-] `se_002` — already clean — Distinguish between Preventive and Corrective maintenance wi
- [x] `se_003` — was 3 dense → now 28 clean points — What is SCRUM? Explain its key elements and describe the SCR
- [x] `se_004` — was 3 dense → now 21 clean points — What is the difference between Software Validation and Softw
- [x] `se_005` — was 4 dense → now 30 clean points, 3 inline diagram(s) — Compare Agile vs. Waterfall vs. Spiral SDLC models — coverin
- [x] `se_006` — was 4 dense → now 29 clean points, 2 inline diagram(s) — Identify the most suitable SDLC model for an Online Library 
- [x] `se_007` — was 9 dense → now 39 clean points, 3 inline diagram(s) — Write concepts of coupling and cohesion with example?

### theory_of_computation — 1 questions — ✅ all 1 rewritten

- [x] `toc_001` — was 3 dense → now 38 clean points, 5 inline diagram(s) — Consider the grammar: E → E + E | E * E | id. Show that the 

