"use client";

import { useState, useEffect } from "react";

const backgroundImages = [
  "/book/book1.jpg",
  "/book/book2.jpg",
  "/book/book3.jpg",
  "/book/book4.jpg",
  "/book/book5.jpg",
  "/book/book6.jpg",
];

const HeroSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0); // Reset progress when slide changes

    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          return 100;
        }
        return prevProgress + 2; // Increment by 2% every 100ms (5000ms / 50 steps = 100ms per step)
      });
    }, 100);

    const slideInterval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [currentImageIndex]);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
    setProgress(0); // Reset progress when manually changing slide
  };

  const nextSlide = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % backgroundImages.length
    );
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? backgroundImages.length - 1 : prevIndex - 1
    );
    setProgress(0);
  };

  return (
    <>
      <section className="relative text-white py-0 sm:py-6 lg:py-24 flex items-center overflow-hidden min-h-[500px] sm:min-h-[600px] lg:min-h-[550px]">
        {/* Background Images */}
        <div className="absolute inset-y-0 left-4 right-4 sm:left-16 sm:right-16 lg:left-8 lg:right-8">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-center bg-no-repeat transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "100% 100%",
              }}
            />
          ))}
        </div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 sm:bg-black/10"></div>

        {/* Navigation Arrows */}
        <div className="hidden sm:block">
          <button
            onClick={prevSlide}
            className="absolute left-12 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 group"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* Slider Progress / Dots BELOW hero */}
      <div className="relative z-10 mt-5 sm:mt-8 mb-8 flex justify-center">
        <div className="flex space-x-2 sm:space-x-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative w-6 sm:w-8 h-2.5 sm:h-3 rounded-full transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                index === currentImageIndex
                  ? "scale-110"
                  : "scale-100 hover:scale-105"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div className="absolute inset-0 bg-white/25 rounded-full"></div>
              {index === currentImageIndex && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              {index !== currentImageIndex && (
                <div className="absolute inset-0 bg-white/50 rounded-full hover:bg-white/70 transition-colors duration-300"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;
