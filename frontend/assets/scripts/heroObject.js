// --- กำหนด "พิมพ์เขียว" ---
    const imageBlueprints = [
      { src: 'assets/images/2.png', widthVw: 6, initialXPercent: 10, initialY: -600 },
      { src: 'assets/images/3.png', widthVw: 6, initialXPercent: 55, initialY: -700 },
      { src: 'assets/images/t4.png', widthVw: 34, initialXPercent: 30, initialY: -200, initialAngle: 0 },
      { src: 'assets/images/t3.png', widthVw: 36, initialXPercent: 80, initialY: -150, initialAngle: 0 },
      { src: 'assets/images/t2.png', widthVw: 38, initialXPercent: 20, initialY: -400, initialAngle: 0 },
      { src: 'assets/images/t1.png', widthVw: 50, initialXPercent: 60, initialY: -350, initialAngle: 0 },
      { src: 'assets/images/1.png', widthVw: 6, initialXPercent: 50, initialY: -500 },
    ];
    
    // --- โหลดรูปภาพ ---
    const loadedImages = {};
    let imagesLoadedCount = 0;
    imageBlueprints.forEach(bp => {
        const img = new Image();
        img.src = bp.src;
        img.onload = () => {
            loadedImages[bp.src] = { img: img, widthVw: bp.widthVw };
            imagesLoadedCount++;
            if (imagesLoadedCount === imageBlueprints.length) {
                initializeMatter();
            }
        };
    });

    function initializeMatter() {
    const heroSection = document.getElementById('heroSection');
    const { Engine, Render, Runner, World, Bodies, Body, Mouse, MouseConstraint } = Matter;
    const engine = Engine.create();
    const world = engine.world;
    engine.world.gravity.y = 0.5;

    const render = Render.create({
        element: heroSection,
        engine: engine,
        options: {
            width: heroSection.clientWidth,
            height: heroSection.clientHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1 
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    function vwToPx(vw) {
      return (vw / 100) * heroSection.clientWidth;
    }

    function populateWorld() {
        World.clear(world, false);
        
        const sectionWidth = heroSection.clientWidth;
        const sectionHeight = heroSection.clientHeight;

        const wallOptions = { isStatic: true, render: { visible: false } };
        World.add(world, [
            Bodies.rectangle(sectionWidth / 2, sectionHeight, sectionWidth, 60, wallOptions), // พื้น
            Bodies.rectangle(-30, sectionHeight / 2, 60, sectionHeight, wallOptions),
            Bodies.rectangle(sectionWidth + 30, sectionHeight / 2, 60, sectionHeight, wallOptions),
        ]);

        imageBlueprints.forEach((blueprint, index) => {
            setTimeout(() => {
                const imageData = loadedImages[blueprint.src];
                if (!imageData) return;

                const x = (blueprint.initialXPercent / 100) * sectionWidth;
                const y = blueprint.initialY;
                
                const imageAspectRatio = imageData.img.naturalHeight / imageData.img.naturalWidth;
                const bodyWidth = vwToPx(imageData.widthVw);
                const bodyHeight = bodyWidth * imageAspectRatio;

                const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
                    angle: blueprint.initialAngle || 0,
                    restitution: 0.2,
                    friction: 0.3,
                    render: {
                        sprite: {
                            texture: imageData.img.src,
                            xScale: bodyWidth / imageData.img.naturalWidth,
                            yScale: bodyHeight / imageData.img.naturalHeight
                        }
                    }
                });

                Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
                World.add(world, body);

            }, index * 500); 
        });
    }

    // --- 💡 ส่วนที่แก้ไข: สร้าง Mouse Control ไว้ก่อน แต่ยังไม่เพิ่มเข้า World ---
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    render.mouse = mouse;
    
    let wheelTimeout;
    const canvasElement = heroSection.querySelector('canvas');

    setTimeout(() => {
        populateWorld();
        World.add(world, mouseConstraint);
    }, 1000);

    // 3. จัดการ Event Listener ทั้งหมดในที่เดียว
    
    // Event listener สำหรับ "wheel" เพื่อให้ scroll ได้
    window.addEventListener('wheel', () => {
        if (canvasElement) {
            canvasElement.style.pointerEvents = 'none';
        }
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (canvasElement) {
                canvasElement.style.pointerEvents = 'auto';
            }
        }, 250);
    }, { passive: true });

    // Event Listener สำหรับ Resize
    window.addEventListener('resize', () => {
        render.canvas.width = heroSection.clientWidth;
        render.canvas.height = heroSection.clientHeight;
        render.options.width = heroSection.clientWidth;
        render.options.height = heroSection.clientHeight;
        render.options.pixelRatio = window.devicePixelRatio || 1;
        
        // เมื่อปรับขนาดจอ ให้สร้างโลกใหม่และเพิ่ม Mouse Control กลับเข้าไปด้วย
        populateWorld();
        World.add(world, mouseConstraint);
    });
}