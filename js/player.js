/* ============================================================
   WILLIAM — silhouette encapuchonnée + animations
   ============================================================ */
const Player = {
  build(scene) {
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0xd6ccb6, roughness: 0.95 });
    const cloth2 = new THREE.MeshStandardMaterial({ color: 0xc3b79c, roughness: 0.95 });
    const belt = new THREE.MeshStandardMaterial({ color: 0x8a2f22, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 1 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9a06b, roughness: 0.9 });

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, 2.1, 12), cloth);
    robe.position.y = 1.05; robe.castShadow = true; g.add(robe);
    const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.34, 12), belt);
    sash.position.y = 1.3; g.add(sash);
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), cloth2);
    cape.material.side = THREE.DoubleSide; cape.position.set(0, 1.25, -0.48); cape.rotation.x = 0.15; cape.castShadow = true; g.add(cape);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.1, 12), cloth);
    hood.position.y = 2.5; hood.castShadow = true; g.add(hood);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.68, 8), cloth);
    beak.position.set(0, 2.7, 0.4); beak.rotation.x = 1.15; g.add(beak);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 12), skin);
    face.position.set(0, 2.3, 0.16); g.add(face);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), dark);
    shade.position.set(0, 2.37, 0.13); g.add(shade);

    const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.15, 8);
    const armL = new THREE.Mesh(armGeo, cloth); armL.position.set(-0.6, 1.55, 0); armL.castShadow = true; g.add(armL);
    const armR = new THREE.Mesh(armGeo, cloth); armR.position.set(0.6, 1.55, 0); armR.castShadow = true; g.add(armR);
    const legGeo = new THREE.CylinderGeometry(0.19, 0.17, 1.0, 8);
    const legL = new THREE.Mesh(legGeo, dark); legL.position.set(-0.26, 0.5, 0); legL.castShadow = true; g.add(legL);
    const legR = new THREE.Mesh(legGeo, dark); legR.position.set(0.26, 0.5, 0); legR.castShadow = true; g.add(legR);

    scene.add(g);
    return { group: g, parts: { armL, armR, legL, legR }, vel: new THREE.Vector3(), onGround: true, walkPhase: 0 };
  },

  animate(p, mode, speed, dt) {
    const P = p.parts;
    if (mode === "climb") {
      p.walkPhase += dt * 6;
      const s = Math.sin(p.walkPhase);
      P.armL.rotation.x = -2.2 + s * 0.4; P.armR.rotation.x = -2.2 - s * 0.4;
      P.legL.rotation.x = s * 0.5; P.legR.rotation.x = -s * 0.5;
      return;
    }
    if (mode === "ride") {
      P.legL.rotation.x = 0.9; P.legR.rotation.x = 0.9;
      P.armL.rotation.x = 0.5; P.armR.rotation.x = 0.5; return;
    }
    if (mode === "move") {
      p.walkPhase += dt * speed * 0.9;
      const s = Math.sin(p.walkPhase) * (speed > 9 ? 0.9 : 0.6);
      P.legL.rotation.x = s; P.legR.rotation.x = -s;
      P.armL.rotation.x = -s * 0.7; P.armR.rotation.x = s * 0.7;
    } else {
      ["legL", "legR", "armL", "armR"].forEach(k => P[k].rotation.x *= 0.8);
    }
  },
};
