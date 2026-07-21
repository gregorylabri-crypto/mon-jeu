/* ============================================================
   PERSONNAGE — William, silhouette encapuchonnée (style furtif)
   + contrôleur à la 3e personne (caméra orbitale à la souris).
   ============================================================ */

const Player = {
  build(scene) {
    const g = new THREE.Group();

    const cloth = new THREE.MeshStandardMaterial({ color: 0xd6ccb6, roughness: 0.95 });   // tunique lin
    const belt = new THREE.MeshStandardMaterial({ color: 0x8a2f22, roughness: 0.8 });      // ceinture rouge béarnaise
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 1 });        // ombre de capuche
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9a06b, roughness: 0.9 });

    // Cape / robe (tronc conique)
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.05, 2.2, 12), cloth);
    robe.position.y = 1.1; robe.castShadow = true; g.add(robe);

    // Ceinture
    const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.35, 12), belt);
    sash.position.y = 1.35; g.add(sash);

    // Pan de cape dans le dos
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), cloth);
    cape.material.side = THREE.DoubleSide;
    cape.position.set(0, 1.3, -0.5); cape.rotation.x = 0.15; cape.castShadow = true; g.add(cape);

    // Épaules / capuche (cône)
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.1, 12), cloth);
    hood.position.y = 2.55; hood.castShadow = true; g.add(hood);
    // pointe de capuche avancée (bec caractéristique)
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), cloth);
    beak.position.set(0, 2.75, 0.42); beak.rotation.x = 1.15; g.add(beak);
    // visage dans l'ombre
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12), skin);
    face.position.set(0, 2.35, 0.18); g.add(face);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), dark);
    shade.position.set(0, 2.42, 0.14); g.add(shade);

    // Bras
    const armGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 8);
    const armL = new THREE.Mesh(armGeo, cloth); armL.position.set(-0.62, 1.6, 0); armL.castShadow = true;
    const armR = new THREE.Mesh(armGeo, cloth); armR.position.set(0.62, 1.6, 0); armR.castShadow = true;
    g.add(armL); g.add(armR);

    // Jambes (pour l'animation de marche)
    const legGeo = new THREE.CylinderGeometry(0.2, 0.18, 1.1, 8);
    const legL = new THREE.Mesh(legGeo, dark); legL.position.set(-0.28, 0.55, 0); legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, dark); legR.position.set(0.28, 0.55, 0); legR.castShadow = true;
    g.add(legL); g.add(legR);

    scene.add(g);

    return {
      group: g,
      parts: { armL, armR, legL, legR },
      vel: new THREE.Vector3(),
      onGround: true,
      walkPhase: 0,
    };
  },

  // Animation de marche (balancement bras/jambes)
  animate(p, moving, speed, dt) {
    if (moving) {
      p.walkPhase += dt * speed * 0.9;
      const s = Math.sin(p.walkPhase) * 0.6;
      p.parts.legL.rotation.x = s;
      p.parts.legR.rotation.x = -s;
      p.parts.armL.rotation.x = -s * 0.7;
      p.parts.armR.rotation.x = s * 0.7;
    } else {
      // retour au repos
      ["legL", "legR", "armL", "armR"].forEach(k => {
        p.parts[k].rotation.x *= 0.8;
      });
    }
  },
};
