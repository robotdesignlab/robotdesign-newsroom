---
title: "Selecting BLDC Motors for Robotic Arms and Mobile Robots: Start With the Mechanical Load"
date: 2026-10-18T13:00:30+09:00
draft: false
categories: ["Industrial"]
tags: ["Robotics", "Industrial", "AI"]
source_url: "https://www.therobotreport.com/how-to-choose-bldc-motor-robotic-arms-mobile-robots/"
source_name: "The Robot Report"
desk: "industrial"
---

Choosing a brushless DC (BLDC) motor for a robotic arm or mobile robot begins with the mechanical system, not the controller catalog, according to guidance from Faisal Mahmood. A motor's voltage and wattage ratings alone do not reveal whether it can deliver required torque at low speed, regulate position accurately, absorb regenerative energy, or survive the thermal duty cycle.

The actuator must be treated as a system, where the motor, inverter, current sensors, rotor position feedback, gearbox, brake, output encoder, thermal path, communications interface, and higher-level robot software all influence the final result. Industrial and collaborative robotic arm joints generally prioritize controllable torque, low-speed smoothness, position accuracy, collision response, backdrivability, and thermal performance. Mobile robot drive motors place more emphasis on efficiency, starting torque, braking, traction, battery utilization, speed regulation, and synchronization between drive channels.

> The actuator is a system. **The motor, inverter, current sensors, rotor position feedback, gearbox, brake, output encoder, thermal path, communications interface, and higher level robot software all influence the result.**

Terminology also matters: commercial robotics literature often uses BLDC and PMSM (permanent magnet synchronous motor) interchangeably because both are three-phase, permanent-magnet machines driven by electronic inverters. Their back EMF waveform, winding design, controller algorithm, and feedback method still determine how a particular motor behaves. STMicroelectronics, for example, treats three-phase BLDC and PMSM control as related application areas and describes both six-step and field-oriented control architectures.

The first selection exercise is to establish what the motor actually has to do. For a geared robotic joint, a useful first-order relationship is: τ_joint = (τ_motor × gear ratio × η_gear) − τ_losses. Motor speed follows the transmission ratio: ω_motor = ω_joint × gear ratio. Mechanical power is P_mech = τ × ω.

---

*Source: [The Robot Report](https://www.therobotreport.com/how-to-choose-bldc-motor-robotic-arms-mobile-robots/)*
