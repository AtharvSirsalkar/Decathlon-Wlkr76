import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  //currentIndex and maxIndex
  const [vals, setVals] = useState({
    currentIndex: 1,
    maxIndex: 650,
  });

  //Preload Images

  useEffect(() => {
    preloadImages();
  }, []);

  const imageObject = useRef([]);
  const imagesLoaded = useRef(0);
  const canvasref = useRef(null);
  const preloadImages = () => {
    for (let i = 0; i <= vals.maxIndex; i++) {
      const imgUrl = `./imgs/${i.toString().padStart(3, "0")}.jpg`;
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => {
        imagesLoaded.current++;
        if (imagesLoaded.current === vals.maxIndex) {
          loadImage(vals.currentIndex);
        }
      };
      imageObject.current.push(img);
    }
  };

  const loadImage = (index) => {
    if (index >= 0 && index <= vals.maxIndex) {
      const img = imageObject.current[index];
      const canvas = canvasref.current;
      if (canvas && img) {
        let ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;
          const scale = Math.max(scaleX, scaleY);
          const newHeight = img.height * scale;
          const newWidth = img.width * scale;
          const offsetX = (canvas.width - newWidth) / 2;
          const offsetY = (canvas.height - newHeight) / 2;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
          setVals((prevVal) => ({
            ...prevVal,
            currentIndex: index,
          }));
        }
      }
    }
  };

  const parentDivRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: parentDivRef.current,
        start: "400",
        scrub: 5,
        end: "bottom bottom",
      },
    });
    tl.to(vals, {
      currentIndex: vals.maxIndex,
      onUpdate: () => {
        loadImage(Math.floor(vals.currentIndex));
      },
    });
  });

  const imageRef = useRef(null);

  gsap.to(imageRef.current, {
    top: "2%",
    opacity: 1, // Fade        // Slightly increase size
    duration: 2.5, // Smooth transition
    ease: "ease", // Makes transition more natural
    scrollTrigger: {
      trigger: imageRef.current,
      start: "0% top",
      end: "100% bottom",
      scrub: 2, // Smoothens the effect based on scroll speed
      toggleActions: "play none none reverse",
    },
  });
  return (
    <>
      <div className="w-full relative">
       <div className="absolute bg-transparent top-[7.6%] ml-15 right-[0%] z-50 sticky" >
       <img src="./heroimage/logo-wlkr.webp" className="object-cover h-[65px] sticky" alt="" />
       </div>
        <div className=" h-screen absolute top-[0%] z-20 w-full bg-[url('./heroimage/hero.jpg')] bg-cover bg-center bg-mask-bottom ">
        
        </div>
        <div className="absolute z-20 bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent"></div>
        <div className="absolute z-20 bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent"></div>
        <div className="">
          <img
            ref={imageRef}
            src="./heroimage/fogg.webp"
            className="z-30 mask-fade opacity-0 w-full absolute top-1 object-cover h-screen object-center"
            alt=""
          />
        </div>
        <div ref={parentDivRef} className="w-full h-[1400vh]">
          <div className="w-full h-screen sticky left-0 top-0">
            <canvas ref={canvasref} className="w-full h-screen"></canvas>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
