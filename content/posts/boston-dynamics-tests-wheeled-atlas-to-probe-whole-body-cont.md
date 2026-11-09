---
title: "Boston Dynamics Tests Wheeled Atlas to Probe Whole-Body Control Limits"
date: 2026-11-09T19:00:31+09:00
draft: false
categories: ["Humanoid"]
tags: ["Robotics", "Humanoid", "AI"]
source_url: "https://www.therobotreport.com/boston-dynamics-adds-wheels-to-atlas-humanoid-to-test-whole-body-control/"
source_name: "The Robot Report"
desk: "humanoid"
---

Boston Dynamics has released a video showing its Atlas humanoid moving on wheels attached to its legs, an experiment that fuses classical model-based motor control with whole-body reinforcement learning to hold dynamic stability on unstructured terrain. The company framed the wheeled Atlas as a research testbed rather than a product, with the work aimed at pushing actuation to its limits and probing adaptability in unpredictable environments.

The experiment was run by Andy Wu, controls engineer for Atlas at Boston Dynamics, who attached wheels to the humanoid's legs. The effort targets a known weakness of purely model-based control: real-world conditions that are difficult to model or simulate. Through a whole-body reinforcement learning policy, Atlas processes real-time proprioceptive feedback and velocity commands, outputting dynamic pose and force adjustments to mitigate unmodeled disturbances and non-ideal contact states.

> Through a whole-body reinforcement learning policy, Atlas processes real-time proprioceptive feedback and velocity commands, **outputting dynamic pose and force adjustments to mitigate unmodeled disturbances and non-ideal contact states.**

Beyond rolling, Atlas performs pirouettes and various aggressive actuation maneuvers, demonstrating that it can switch smoothly between fast rolling on flat terrain and articulated legged motion over obstacles or irregular surfaces. Wu trained the system in simulation, and according to him the learned behaviors executed in real life with surprising accuracy. He described converting Atlas's locomotion style as wonderfully simple: a single custom adapter mounts an off-the-shelf scooter rim onto Atlas's existing ankle actuator, and that is the only new part in the whole build.

The work is presented as a controls engineering exploration rather than a commercial direction, with Boston Dynamics explicitly stating that a wheeled Atlas is not a product. The experiment's value lies in testing how reinforcement-learning policies and model-based control can be combined to handle contact states and disturbances that resist simulation.

---

*Source: [The Robot Report](https://www.therobotreport.com/boston-dynamics-adds-wheels-to-atlas-humanoid-to-test-whole-body-control/)*
