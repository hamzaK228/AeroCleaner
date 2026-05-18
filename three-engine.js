// Aero Cleaner 3D WebGL Engine — Full Rebuild
// Accurately matches the reference photo: yellow truncated pyramid, red box, round exhaust fan, solar panels, louvers, cables, smoke

let scene, camera, renderer, controls;
let baseGroup, coreGroup, topGroup, fanBladesGroup;
let airParticles = [];
let smogParticles = [];
const particleCount = 35;
const smogCount = 25;

let isExploded = false;
let baseTargetY = 0;
let coreTargetY = 0;
let topTargetY = 0;

// Global sloped face references for disassembly explosion
let frontGroup, rightGroup, backGroup, leftGroup;
let frontVentSubGroup, frontLabelSubGroup;
let rightVentSubGroup, leftVentSubGroup;
let backSolarSubGroup1, backSolarSubGroup2;

let faceExplodeOffset = 0;
let faceExplodeTarget = 0;
let subExplodeOffset = 0;
let subExplodeTarget = 0;

let midYVal = 0;
let midInradiusVal = 0;

// Dimensions matching the reference
const BASE_BOTTOM = 1.6;   // half-width at bottom
const BASE_TOP = 0.55;     // half-width at top
const BASE_HEIGHT = 1.0;
const RED_BOX_W = 0.78;
const RED_BOX_H = 0.38;
const EXHAUST_R = 0.42;
const EXHAUST_H = 0.12;

function init3D() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(5.2, 4.6, 9.0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.8;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set(0, 1.15, 0);

    // Lighting — studio setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const key = new THREE.DirectionalLight(0xfff5e0, 1.0);
    key.position.set(5, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.5);
    fill.position.set(-5, 4, -3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(0, 6, -6);
    scene.add(rim);

    const glow = new THREE.PointLight(0x10b981, 1.2, 6);
    glow.position.set(0, 0.5, 0);
    scene.add(glow);

    buildModel();
    initAirflow();
    initSmogPlume();
    animate();

    // Prevent zero-height canvas bug on mobile page load
    onResize();
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 150);
    setTimeout(onResize, 500);
}

/* ============================================================
   MATERIALS
   ============================================================ */
function makeMaterials() {
    return {
        yellow: new THREE.MeshStandardMaterial({ color: 0xf5b800, roughness: 0.32, metalness: 0.08 }),
        red: new THREE.MeshStandardMaterial({ color: 0xc62b10, roughness: 0.38, metalness: 0.15 }),
        charcoal: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.85 }),
        silver: new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.18, metalness: 0.92 }),
        solar: new THREE.MeshStandardMaterial({ color: 0x1a3568, roughness: 0.1, metalness: 0.88 }),
        cable: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.65, metalness: 0.2 }),
        greenGlow: new THREE.MeshStandardMaterial({
            color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.75
        }),
        labelWhite: new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.5, metalness: 0.05 }),
        copperRing: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.25, metalness: 0.8 }),
    };
}

/* ============================================================
   BUILD MODEL
   ============================================================ */
function buildModel() {
    const M = makeMaterials();

    // ── 1. BASE: Yellow Truncated Pyramid ──
    baseGroup = new THREE.Group();

    // The pyramid is a CylinderGeometry with 4 radial segments rotated 45°
    const pyrGeo = new THREE.CylinderGeometry(BASE_TOP, BASE_BOTTOM, BASE_HEIGHT, 4, 1, false, Math.PI / 4);
    const pyrMesh = new THREE.Mesh(pyrGeo, M.yellow);
    pyrMesh.position.y = BASE_HEIGHT / 2;
    pyrMesh.castShadow = true;
    pyrMesh.receiveShadow = true;
    baseGroup.add(pyrMesh);

    // Flat bottom plate
    const plateGeo = new THREE.BoxGeometry(BASE_BOTTOM * 2 * 0.72, 0.04, BASE_BOTTOM * 2 * 0.72);
    const plate = new THREE.Mesh(plateGeo, M.yellow);
    plate.position.y = 0.02;
    plate.receiveShadow = true;
    baseGroup.add(plate);

    // Top deck (flat yellow rim on top of pyramid)
    const deckGeo = new THREE.BoxGeometry(BASE_TOP * 2 * 0.72, 0.05, BASE_TOP * 2 * 0.72);
    const deck = new THREE.Mesh(deckGeo, M.yellow);
    deck.position.y = BASE_HEIGHT + 0.025;
    baseGroup.add(deck);

    // ── Face details ──
    // Calculate face geometry: 4 faces rotated 45°, so face normals point at ±X, ±Z after 45° rotation
    // Face 0: +Z (front), Face 1: +X (right), Face 2: -Z (back), Face 3: -X (left)
    // The inradius at height y: lerp(BASE_BOTTOM, BASE_TOP, y/H) * cos(45°)
    const cos45 = Math.cos(Math.PI / 4);
    const midY = BASE_HEIGHT * 0.5;
    const midInradius = (BASE_BOTTOM + (BASE_TOP - BASE_BOTTOM) * (midY / BASE_HEIGHT)) * cos45;
    const slopeAngle = Math.atan2((BASE_BOTTOM - BASE_TOP) * cos45, BASE_HEIGHT);

    function getFaceWAt(localY) {
        const absoluteY = midY + localY * Math.cos(slopeAngle);
        const r = (BASE_BOTTOM + (BASE_TOP - BASE_BOTTOM) * (absoluteY / BASE_HEIGHT)) * cos45;
        return r * 2;
    }

    function createCustomShapeGeo(leftScale, rightScale, h, depth, yOffset = 0) {
        const shape = new THREE.Shape();
        const bW = getFaceWAt(-h/2 + yOffset);
        const tW = getFaceWAt(h/2 + yOffset);
        shape.moveTo(bW * leftScale, -h/2);
        shape.lineTo(bW * rightScale, -h/2);
        shape.lineTo(tW * rightScale, h/2);
        shape.lineTo(tW * leftScale, h/2);
        shape.lineTo(bW * leftScale, -h/2);
        const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
        geo.translate(0, 0, -depth/2);
        return geo;
    }

    midYVal = midY;
    midInradiusVal = midInradius;

    // ── FRONT FACE (Z+): Brand Plate (left half) + Vent Louvers (right half) ──
    frontGroup = new THREE.Group();
    frontGroup.position.set(0, midY, midInradius);
    frontGroup.rotation.order = 'YXZ';
    frontGroup.rotation.y = 0;
    frontGroup.rotation.x = -slopeAngle;

    const spH = BASE_HEIGHT * 0.7;

    // Sub-group for Front Louver Vent (right half)
    frontVentSubGroup = new THREE.Group();

    // Louver Vent Frame (right half)
    const ventFrameGeo = createCustomShapeGeo(0.03, 0.47, spH, 0.035);
    const ventFrame = new THREE.Mesh(ventFrameGeo, M.charcoal);
    frontVentSubGroup.add(ventFrame);

    // Horizontal Divider in the middle of the vent
    const midW = getFaceWAt(0) * 0.44;
    const midDiv = new THREE.Mesh(new THREE.BoxGeometry(midW, 0.03, 0.045), M.silver);
    midDiv.position.set(getFaceWAt(0) * 0.25, 0, 0.005);
    frontVentSubGroup.add(midDiv);

    // Slat count per section
    const secSlatCount = 6;
    
    // Top Section Vents (y from 0.03 to spH/2 - 0.03)
    const topSecStart = 0.03;
    const topSecEnd = spH / 2 - 0.03;
    for (let i = 0; i < secSlatCount; i++) {
        const yOff = topSecStart + i * ((topSecEnd - topSecStart) / (secSlatCount - 1));
        const curW = getFaceWAt(yOff);
        const sGeo = new THREE.BoxGeometry(curW * 0.4, 0.012, 0.04);
        const s = new THREE.Mesh(sGeo, M.charcoal);
        s.position.set(curW * 0.25, yOff, 0.015);
        s.rotation.x = 0.4;
        frontVentSubGroup.add(s);
    }

    // Bottom Section Vents (y from -spH/2 + 0.03 to -0.03)
    const botSecStart = -spH / 2 + 0.03;
    const botSecEnd = -0.03;
    for (let i = 0; i < secSlatCount; i++) {
        const yOff = botSecStart + i * ((botSecEnd - botSecStart) / (secSlatCount - 1));
        const curW = getFaceWAt(yOff);
        const sGeo = new THREE.BoxGeometry(curW * 0.4, 0.012, 0.04);
        const s = new THREE.Mesh(sGeo, M.charcoal);
        s.position.set(curW * 0.25, yOff, 0.015);
        s.rotation.x = 0.4;
        frontVentSubGroup.add(s);
    }

    frontGroup.add(frontVentSubGroup);

    // Sub-group for Brand Label (left half)
    frontLabelSubGroup = new THREE.Group();

    // 1. Logo Badge (silver/gray square at top-left)
    const logoY = spH * 0.28;
    const logoW = getFaceWAt(logoY) * 0.12;
    const logoGeo = new THREE.BoxGeometry(logoW, logoW, 0.02);
    const logoMesh = new THREE.Mesh(logoGeo, M.silver);
    logoMesh.position.set(-getFaceWAt(logoY) * 0.25, logoY, 0.01);
    frontLabelSubGroup.add(logoMesh);
    
    // Tiny blue icon inside logo badge
    const iconGeo = new THREE.BoxGeometry(logoW * 0.6, logoW * 0.6, 0.025);
    const iconMesh = new THREE.Mesh(iconGeo, M.solar);
    iconMesh.position.set(-getFaceWAt(logoY) * 0.25, logoY, 0.012);
    frontLabelSubGroup.add(iconMesh);

    // 2. White Specs Card (middle-left)
    const cardY = spH * 0.02;
    const cardH = spH * 0.32;
    const cardGeo = createCustomShapeGeo(-0.45, -0.05, cardH, 0.015, cardY);
    const cardMesh = new THREE.Mesh(cardGeo, M.labelWhite);
    cardMesh.position.set(0, cardY, 0.005);
    frontLabelSubGroup.add(cardMesh);

    // Specs lines on the card
    for (let i = 0; i < 4; i++) {
        const lineY = cardY + cardH * 0.3 - i * (cardH * 0.2);
        const lineW = getFaceWAt(lineY) * 0.32;
        const lineGeo = new THREE.BoxGeometry(lineW, 0.012, 0.02);
        const lineMesh = new THREE.Mesh(lineGeo, M.charcoal);
        lineMesh.position.set(-getFaceWAt(lineY) * 0.25, lineY, 0.015);
        frontLabelSubGroup.add(lineMesh);
    }

    // 3. Large "AERO CLEANER" Brand Text (bottom-left)
    const textY = -spH * 0.32;
    const textH = spH * 0.18;
    const textGeo = createCustomShapeGeo(-0.45, -0.05, textH, 0.02, textY);
    const textMesh = new THREE.Mesh(textGeo, M.charcoal);
    textMesh.position.set(0, textY, 0.01);
    frontLabelSubGroup.add(textMesh);

    // Silver inset letters/bars inside the brand plate
    for (let i = 0; i < 2; i++) {
        const barY = textY + (i === 0 ? 0.02 : -0.02);
        const barW = getFaceWAt(barY) * 0.34;
        const barGeo = new THREE.BoxGeometry(barW, 0.018, 0.025);
        const barMesh = new THREE.Mesh(barGeo, M.silver);
        barMesh.position.set(-getFaceWAt(barY) * 0.25, barY, 0.022);
        frontLabelSubGroup.add(barMesh);
    }

    frontGroup.add(frontLabelSubGroup);
    baseGroup.add(frontGroup);

    // ── RIGHT FACE (X+): Full Louver Vents ──
    rightGroup = new THREE.Group();
    rightGroup.position.set(midInradius, midY, 0);
    rightGroup.rotation.order = 'YXZ';
    rightGroup.rotation.y = Math.PI / 2;
    rightGroup.rotation.x = -slopeAngle;

    rightVentSubGroup = new THREE.Group();

    const ventH = spH;
    const rightVentFrameGeo = createCustomShapeGeo(-0.39, 0.39, ventH, 0.03);
    const rightVentFrame = new THREE.Mesh(rightVentFrameGeo, M.charcoal);
    rightVentSubGroup.add(rightVentFrame);

    // Vertical divider
    const divGeo = new THREE.BoxGeometry(0.025, ventH, 0.04);
    const div = new THREE.Mesh(divGeo, M.silver);
    div.position.z = 0.01;
    rightVentSubGroup.add(div);

    const slatCount = 10;
    for (let i = 0; i < slatCount; i++) {
        const yOff = -ventH * 0.42 + i * (ventH * 0.84 / (slatCount - 1));
        const curW = getFaceWAt(yOff);
        const sGeo = new THREE.BoxGeometry(curW * 0.34, 0.012, 0.04);
        const s = new THREE.Mesh(sGeo, M.charcoal);
        s.position.set(-curW * 0.195, yOff, 0.015);
        s.rotation.x = 0.4;
        rightVentSubGroup.add(s);
    }
    for (let i = 0; i < slatCount; i++) {
        const yOff = -ventH * 0.42 + i * (ventH * 0.84 / (slatCount - 1));
        const curW = getFaceWAt(yOff);
        const sGeo = new THREE.BoxGeometry(curW * 0.34, 0.012, 0.04);
        const s = new THREE.Mesh(sGeo, M.charcoal);
        s.position.set(curW * 0.195, yOff, 0.015);
        s.rotation.x = 0.4;
        rightVentSubGroup.add(s);
    }
    rightGroup.add(rightVentSubGroup);
    baseGroup.add(rightGroup);

    // ── BACK FACE (-Z): Double Solar Panels ──
    backGroup = new THREE.Group();
    backGroup.position.set(0, midY, -midInradius);
    backGroup.rotation.order = 'YXZ';
    backGroup.rotation.y = Math.PI;
    backGroup.rotation.x = -slopeAngle;

    backSolarSubGroup1 = new THREE.Group();
    backSolarSubGroup2 = new THREE.Group();

    // Two solar panels side-by-side
    for (let col = -1; col <= 1; col += 2) {
        const subGrp = col === -1 ? backSolarSubGroup1 : backSolarSubGroup2;
        const lScale = col === -1 ? -0.45 : 0.03;
        const rScale = col === -1 ? -0.03 : 0.45;
        const centerOffset = col === -1 ? -0.24 : 0.24;

        const spFrameGeo = createCustomShapeGeo(lScale, rScale, spH, 0.035);
        const spFrame = new THREE.Mesh(spFrameGeo, M.silver);
        subGrp.add(spFrame);
        
        const spSilGeo = createCustomShapeGeo(lScale + 0.02, rScale - 0.02, spH * 0.92, 0.04);
        const spSilicon = new THREE.Mesh(spSilGeo, M.solar);
        spSilicon.position.z = 0.012;
        subGrp.add(spSilicon);

        // grid lines vertical
        for (let i = -2; i <= 2; i++) {
            const localXOff = i * 0.07; 
            const topX = getFaceWAt(spH/2) * (centerOffset + localXOff);
            const botX = getFaceWAt(-spH/2) * (centerOffset + localXOff);
            const dx = topX - botX;
            const dy = spH * 0.88;
            const len = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dx, dy);
            
            const wGeo = new THREE.CylinderGeometry(0.003, 0.003, len);
            const w = new THREE.Mesh(wGeo, M.silver);
            w.position.set((topX + botX)/2, 0, 0.02);
            w.rotation.z = -angle;
            subGrp.add(w);
        }
        // grid lines horizontal
        for (let i = -4; i <= 4; i++) {
            const hOff = i * (spH * 0.1);
            const curW = getFaceWAt(hOff) * 0.38;
            const wGeo = new THREE.BoxGeometry(curW, 0.005, 0.008);
            const w = new THREE.Mesh(wGeo, M.silver);
            w.position.set(getFaceWAt(hOff) * centerOffset, hOff, 0.02);
            subGrp.add(w);
        }
    }
    backGroup.add(backSolarSubGroup1);
    backGroup.add(backSolarSubGroup2);
    baseGroup.add(backGroup);

    // ── LEFT FACE (-X): Full Louver Vents ──
    leftGroup = new THREE.Group();
    leftGroup.position.set(-midInradius, midY, 0);
    leftGroup.rotation.order = 'YXZ';
    leftGroup.rotation.y = -Math.PI / 2;
    leftGroup.rotation.x = -slopeAngle;

    leftVentSubGroup = new THREE.Group();

    const lVentFrameGeo = createCustomShapeGeo(-0.39, 0.39, ventH, 0.03);
    const lVentFrame = new THREE.Mesh(lVentFrameGeo, M.charcoal);
    leftVentSubGroup.add(lVentFrame);
    const lDiv = new THREE.Mesh(new THREE.BoxGeometry(0.025, ventH, 0.04), M.silver);
    lDiv.position.z = 0.01;
    leftVentSubGroup.add(lDiv);
    for (let col = -1; col <= 1; col += 2) {
        for (let i = 0; i < slatCount; i++) {
            const yOff = -ventH * 0.42 + i * (ventH * 0.84 / (slatCount - 1));
            const curW = getFaceWAt(yOff);
            const s = new THREE.Mesh(new THREE.BoxGeometry(curW * 0.34, 0.012, 0.04), M.charcoal);
            s.position.set(col * curW * 0.195, yOff, 0.015);
            s.rotation.x = 0.4;
            leftVentSubGroup.add(s);
        }
    }
    leftGroup.add(leftVentSubGroup);
    baseGroup.add(leftGroup);

    scene.add(baseGroup);

    // ── 2. CORE: Red Intake Box ──
    coreGroup = new THREE.Group();
    const coreY = BASE_HEIGHT + 0.025 + RED_BOX_H / 2;
    coreGroup.position.y = coreY;
    coreTargetY = coreY;

    const redBoxGeo = new THREE.BoxGeometry(RED_BOX_W, RED_BOX_H, RED_BOX_W);
    const redBox = new THREE.Mesh(redBoxGeo, M.red);
    redBox.castShadow = true;
    redBox.receiveShadow = true;
    coreGroup.add(redBox);

    // Inner green glow cylinder (visible through gaps)
    const innerGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, RED_BOX_H * 0.9, 16),
        M.greenGlow
    );
    coreGroup.add(innerGlow);

    // Cables from red box drooping down to yellow body — 4 corners
    const cableOffsets = [
        { x: RED_BOX_W * 0.45, z: RED_BOX_W * 0.45 },
        { x: -RED_BOX_W * 0.45, z: RED_BOX_W * 0.45 },
        { x: RED_BOX_W * 0.45, z: -RED_BOX_W * 0.45 },
        { x: -RED_BOX_W * 0.45, z: -RED_BOX_W * 0.45 },
    ];
    cableOffsets.forEach(off => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(off.x * 0.8, -RED_BOX_H * 0.35, off.z * 0.8),
            new THREE.Vector3(off.x * 1.1, -RED_BOX_H * 0.55, off.z * 1.1),
            new THREE.Vector3(off.x * 1.3, -RED_BOX_H * 0.7, off.z * 1.3),
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.014, 6, false), M.cable);
        coreGroup.add(tube);
    });

    scene.add(coreGroup);

    // ── 3. TOP: Round Exhaust Fan Assembly ──
    topGroup = new THREE.Group();
    const topY = coreY + RED_BOX_H / 2 + EXHAUST_H / 2;
    topGroup.position.y = topY;
    topTargetY = topY;

    // Dark exhaust cylinder
    const exhGeo = new THREE.CylinderGeometry(EXHAUST_R, EXHAUST_R, EXHAUST_H, 32);
    const exhMesh = new THREE.Mesh(exhGeo, M.charcoal);
    exhMesh.castShadow = true;
    topGroup.add(exhMesh);

    // Copper/bronze rim ring at the base
    const rimGeo = new THREE.TorusGeometry(EXHAUST_R, 0.018, 8, 32);
    const rim2 = new THREE.Mesh(rimGeo, M.copperRing);
    rim2.position.y = -EXHAUST_H / 2;
    rim2.rotation.x = Math.PI / 2;
    topGroup.add(rim2);

    // Copper rim at top
    const rimTop = new THREE.Mesh(rimGeo.clone(), M.copperRing);
    rimTop.position.y = EXHAUST_H / 2;
    rimTop.rotation.x = Math.PI / 2;
    topGroup.add(rimTop);

    // Concentric grill rings
    for (let r = 0.1; r <= EXHAUST_R - 0.05; r += 0.1) {
        const ringGeo = new THREE.TorusGeometry(r, 0.007, 8, 32);
        const ring = new THREE.Mesh(ringGeo, M.silver);
        ring.position.y = EXHAUST_H / 2 + 0.005;
        ring.rotation.x = Math.PI / 2;
        topGroup.add(ring);
    }

    // Radial grill bars
    for (let i = 0; i < 8; i++) {
        const barGeo = new THREE.CylinderGeometry(0.006, 0.006, EXHAUST_R * 2 - 0.06);
        const bar = new THREE.Mesh(barGeo, M.silver);
        bar.position.y = EXHAUST_H / 2 + 0.005;
        bar.rotation.x = Math.PI / 2;
        bar.rotation.y = i * Math.PI / 4;
        topGroup.add(bar);
    }

    // Central hub
    const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    const hub = new THREE.Mesh(hubGeo, M.charcoal);
    hub.position.y = EXHAUST_H / 2 + 0.02;
    topGroup.add(hub);

    // Fan blades group (will spin)
    fanBladesGroup = new THREE.Group();
    fanBladesGroup.position.y = EXHAUST_H / 2 + 0.01;
    for (let i = 0; i < 6; i++) {
        const bladeGeo = new THREE.BoxGeometry(0.05, 0.008, 0.22);
        const blade = new THREE.Mesh(bladeGeo, M.charcoal);
        const angle = i * Math.PI / 3;
        blade.position.set(Math.sin(angle) * 0.14, 0, Math.cos(angle) * 0.14);
        blade.rotation.y = angle;
        blade.rotation.z = 0.3;
        fanBladesGroup.add(blade);
    }
    topGroup.add(fanBladesGroup);

    scene.add(topGroup);
}

/* ============================================================
   PARTICLES
   ============================================================ */
function initAirflow() {
    const geo = new THREE.SphereGeometry(0.018, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
    for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geo, mat.clone());
        resetAirParticle(p);
        airParticles.push(p);
        scene.add(p);
    }
}

function resetAirParticle(p) {
    const aqi = window.AQI_STATE || 20;
    const cleanRatio = Math.max(0, 1 - (aqi - 20) / 280); // 1 at clean (20), 0 at toxic (300)

    p.position.set(
        (Math.random() - 0.5) * 0.5,
        0.15 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5
    );
    p.speedY = (0.015 + Math.random() * 0.015) * (0.35 + 0.65 * cleanRatio);
    p.material.opacity = 0.85 * cleanRatio;

    // Shift color: glowing emerald (clean) vs clogged grey (polluted)
    if (cleanRatio > 0.4) {
        p.material.color.setHex(0x10b981);
    } else {
        p.material.color.setHex(0x556b60);
    }
}

function initSmogPlume() {
    const geo = new THREE.SphereGeometry(0.07, 8, 8);
    for (let i = 0; i < smogCount; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0 });
        const p = new THREE.Mesh(geo, mat);
        resetSmogParticle(p);
        p.position.y += Math.random() * 1.5;
        smogParticles.push(p);
        scene.add(p);
    }
}

function resetSmogParticle(p) {
    const aqi = window.AQI_STATE || 20;
    const smogRatio = Math.min(1, Math.max(0, (aqi - 20) / 280)); // 0 at clean (20), 1 at toxic (300)

    p.position.set(
        (Math.random() - 0.5) * 0.12,
        topGroup.position.y + EXHAUST_H / 2 + 0.05,
        (Math.random() - 0.5) * 0.12
    );
    p.scale.setScalar(0.35 + 1.25 * smogRatio);
    p.speedY = (0.005 + Math.random() * 0.005) * (0.5 + 1.5 * smogRatio);
    p.speedX = (Math.random() - 0.5) * 0.003;
    p.speedZ = (Math.random() - 0.5) * 0.003;
    
    // Shift color: thick brownish-grey toxic plume vs faint background dust
    if (smogRatio > 0.4) {
        p.material.color.setHex(0x6b5b4e); // Heavy brown-grey smog
    } else {
        p.material.color.setHex(0x444444); // Faint light grey dust
    }
    p.material.opacity = (0.22 + Math.random() * 0.12) * smogRatio;
}

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
function animate() {
    requestAnimationFrame(animate);

    // Smooth exploded/assembled transitions
    baseGroup.position.y += (baseTargetY - baseGroup.position.y) * 0.08;
    coreGroup.position.y += (coreTargetY - coreGroup.position.y) * 0.08;
    topGroup.position.y += (topTargetY - topGroup.position.y) * 0.08;

    // Smoothly expand sloped outer face panels radially outwards in exploded view
    faceExplodeOffset += (faceExplodeTarget - faceExplodeOffset) * 0.08;
    subExplodeOffset += (subExplodeTarget - subExplodeOffset) * 0.08;

    if (frontGroup && backGroup && rightGroup && leftGroup) {
        frontGroup.position.z = midInradiusVal + faceExplodeOffset;
        backGroup.position.z = -midInradiusVal - faceExplodeOffset;
        rightGroup.position.x = midInradiusVal + faceExplodeOffset;
        leftGroup.position.x = -midInradiusVal - faceExplodeOffset;
    }

    // Smoothly pop out sub-components (vents, solar panels, cards) off the sloped plates
    if (frontVentSubGroup && frontLabelSubGroup) {
        frontVentSubGroup.position.z = subExplodeOffset;
        frontLabelSubGroup.position.z = subExplodeOffset * 0.75;
    }
    if (rightVentSubGroup) {
        rightVentSubGroup.position.z = subExplodeOffset;
    }
    if (leftVentSubGroup) {
        leftVentSubGroup.position.z = subExplodeOffset;
    }
    if (backSolarSubGroup1 && backSolarSubGroup2) {
        // Solar panels expand outward locally as well
        backSolarSubGroup1.position.z = subExplodeOffset;
        backSolarSubGroup2.position.z = subExplodeOffset;
    }

    // Smoothly shift camera controls target vertically to keep entire exploded view in focus
    if (controls) {
        const targetCenterY = isExploded ? 1.25 : 0.9;
        controls.target.y += (targetCenterY - controls.target.y) * 0.08;
    }

    // Spin fan blades: speed depends on AQI (fast filtration under heavy load, calm passive speed under normal load)
    if (fanBladesGroup) {
        const aqi = window.AQI_STATE || 20;
        const smogRatio = Math.min(1, Math.max(0, (aqi - 20) / 280));
        const fanSpeed = 0.04 + 0.18 * smogRatio; // 0.04 (calm) to 0.22 (rapid filtration)
        fanBladesGroup.rotation.y += fanSpeed;
    }

    // Air particles rising
    airParticles.forEach(p => {
        p.position.y += p.speedY;
        p.position.x += (Math.random() - 0.5) * 0.006;
        p.position.z += (Math.random() - 0.5) * 0.006;
        if (p.position.y > 1.8) {
            const aqi = window.AQI_STATE || 20;
            const cleanRatio = Math.max(0, 1 - (aqi - 20) / 280);
            p.material.opacity -= (0.03 * (2 - cleanRatio)); // decays faster in dirty environments
        }
        if (p.position.y > 2.8 || p.material.opacity <= 0) resetAirParticle(p);
    });

    // Smog plume
    smogParticles.forEach(p => {
        p.position.y += p.speedY;
        p.position.x += p.speedX;
        p.position.z += p.speedZ;
        const s = p.scale.x + 0.012;
        p.scale.setScalar(s);
        p.material.opacity -= 0.002;
        if (p.material.opacity <= 0 || p.position.y > 3.5) resetSmogParticle(p);
    });

    // 3D-to-2D Interactive Hotspot Projection System
    if (window._hotspotSuction || 
        (window._hotspotSuction = document.querySelector('.hotspot-suction'))) {
        
        const spotSuction = window._hotspotSuction;
        const spotFilter = window._hotspotFilter || (window._hotspotFilter = document.querySelector('.hotspot-filter'));
        const spotIonizer = window._hotspotIonizer || (window._hotspotIonizer = document.querySelector('.hotspot-ionizer'));
        const spotSolar = window._hotspotSolar || (window._hotspotSolar = document.querySelector('.hotspot-solar'));

        // Helper to project 3D coordinate to HTML absolute position
        const projectHotspot = (localPos, el, facingNormal, groupMesh) => {
            if (!el) return;
            
            const worldPos = new THREE.Vector3().copy(localPos);
            if (groupMesh) {
                groupMesh.localToWorld(worldPos);
            }

            // 1. Back-face culling / visibility calculation
            if (facingNormal && groupMesh && camera) {
                const toCamera = new THREE.Vector3().copy(camera.position).sub(worldPos).normalize();
                
                // Get world orientation of normal
                const worldNormal = new THREE.Vector3().copy(facingNormal)
                    .applyQuaternion(groupMesh.getWorldQuaternion(new THREE.Quaternion()))
                    .normalize();
                
                const dot = worldNormal.dot(toCamera);
                
                // Muted transition for realistic occlusion
                if (dot < 0.1) {
                    el.style.opacity = '0';
                    el.style.pointerEvents = 'none';
                    return;
                } else {
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';
                }
            }

            // 2. Project world coordinates to normalized screen coordinates [-1, 1]
            const proj = worldPos.project(camera);

            // 3. Map to CSS percentages [0, 100]
            const x = (proj.x * 0.5 + 0.5) * 100;
            const y = (-(proj.y * 0.5) + 0.5) * 100;

            el.style.left = `${x.toFixed(2)}%`;
            el.style.top = `${y.toFixed(2)}%`;
        };

        // Project each hotspot to its respective 3D component with millisecond precision
        if (topGroup) {
            projectHotspot(new THREE.Vector3(0, EXHAUST_H / 2, 0), spotSuction, new THREE.Vector3(0, 1, 0), topGroup);
        }
        if (coreGroup) {
            projectHotspot(new THREE.Vector3(0, 0, 0.46), spotFilter, new THREE.Vector3(0, 0, 1), coreGroup);
        }
        if (frontGroup) {
            // Anchor to the front vent louvers
            projectHotspot(new THREE.Vector3(0.18, 0, 0.12), spotIonizer, new THREE.Vector3(0, 0, 1), frontGroup);
        }
        if (backGroup) {
            // Anchor to the back solar grid
            projectHotspot(new THREE.Vector3(0, 0.25, 0.12), spotSolar, new THREE.Vector3(0, 0, 1), backGroup);
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

function onResize() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

/* ============================================================
   EXPLODED VIEW API
   ============================================================ */
window.toggleExplodedCore = function(exploded) {
    isExploded = exploded;
    const coreRestY = BASE_HEIGHT + 0.025 + RED_BOX_H / 2;
    const topRestY = coreRestY + RED_BOX_H / 2 + EXHAUST_H / 2;
    if (isExploded) {
        baseTargetY = -0.32;
        coreTargetY = coreRestY + 0.35;
        topTargetY = topRestY + 0.95;
        faceExplodeTarget = 0.38;
        subExplodeTarget = 0.22;
    } else {
        baseTargetY = 0;
        coreTargetY = coreRestY;
        topTargetY = topRestY;
        faceExplodeTarget = 0;
        subExplodeTarget = 0;
    }
};


// Call onResize once stylesheet layout completes on full window load
window.addEventListener('load', onResize);

document.addEventListener('DOMContentLoaded', init3D);
