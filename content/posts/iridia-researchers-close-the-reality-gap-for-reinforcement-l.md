---
title: "IRIDIA Researchers Close the Reality Gap for Reinforcement-Learned Robot Swarms"
date: 2026-11-17T13:00:31+09:00
draft: false
categories: ["Research"]
tags: ["Robotics", "Research", "AI"]
source_url: "https://robohub.org/robot-swarms-trained-by-trial-and-error-in-simulation-keep-working-on-real-robots/"
source_name: "Robohub"
desk: "research"
---

Researchers at IRIDIA, the artificial intelligence laboratory of the Université libre de Bruxelles (ULB), have demonstrated a method that lets robot swarms trained through reinforcement learning in simulation continue to perform reliably after being transferred to physical robots. The work, reported in Science Robotics, addresses one of the field's most persistent obstacles: the mismatch between simulated and real robot behavior known as the "reality gap."

Reinforcement learning allows robots to acquire behaviors autonomously through trial and error, typically within a computer simulation. But simulated and real robots never behave identically, and reinforcement learning has long been especially sensitive to this discrepancy. Friction, sensor noise and mechanical imprecision rarely match their simulated counterparts, so skills learned in simulation tend to degrade when a robot encounters the real world. Swarm robotics, according to the source, followed a different path from the reinforcement learning advances seen in legged locomotion and robotic manipulation, relying instead on a tradition of modular design methods that assemble behaviors from predefined building blocks.

> Swarm robotics, according to the source, followed a different path from the reinforcement learning advances seen in legged locomotion and robotic manipulation, **relying instead on a tradition of modular design methods that assemble behaviors from predefined building blocks.**

The IRIDIA team — Ilyes Gharbi, Mauro Birattari and colleagues at the Brussels School of Engineering, ULB — frames the motivation in applied terms: teaching a swarm to search for survivors after an earthquake, or to explore a hostile site, entirely inside a computer before risking a real machine. Their reported result is that swarms trained with their method in simulation keep performing reliably once moved onto real robots, offering a route around the reality gap for swarm systems.

The source does not detail the specific algorithmic mechanism, the number or type of physical robots used, the task benchmarks evaluated, or quantitative performance comparisons against baselines. It also does not specify next steps or stated limitations beyond the general problem of the reality gap itself.

---

*Source: [Robohub](https://robohub.org/robot-swarms-trained-by-trial-and-error-in-simulation-keep-working-on-real-robots/)*
