---
title: HRT Macroplace Challenge
subtitle: Placed 103 Globally in VLSI Placement
tags: [Python, TensorFlow, C++, GNN, RL, Docker]
order: 1
demoUrl: "https://example.com/hrt-demo"
githubUrl: "https://github.com"
---
- Placed **103 globally** in the Hudson River Trading (HRT) x Partcl Macroplacement challenge.
- Beat Simulated Annealing by **23.7% average proxy cost** across all 17 IBM benchmarks (peak +26.5% on ibm02).
- Built a **GNN + RL pipeline** for VLSI macro placement on 200,000+ node circuits, encoding netlist data as heterogeneous tripartite graphs (macros, nets, ports) with KNN spatial edges for congestion-aware reasoning.
- Integrated AutoDMP on **NVIDIA DREAMPlace** as a post-processing legalization engine to resolve macro overlaps.
- Eliminated O(N²) compute by vectorizing HPWL on tensor cores and offloading spatial queries to KNN routines.

![HRT Macroplace Challenge Mockup](/hrt_mockup.png)

