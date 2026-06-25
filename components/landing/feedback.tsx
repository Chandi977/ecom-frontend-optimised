import { useRef } from "react";
import dynamic from "next/dynamic";
import { testimonial } from "../../assets/data";

const Slider: any = dynamic(() => import("react-slick"), { ssr: false });

const Feedback = () => {
  const sliderRef = useRef<any>(null);
  var settings = {
    dots: false,
    infinite: true,
    arrows: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    padding: 26,
    centerMode: true,
    centerPadding: 0,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
          arrows: false,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: false,
        },
      },
    ],
  };
  return (
    <div className="feedback-main">
      <div
        className="feedback-arrow-prev"
        onClick={() => sliderRef.current?.slickPrev?.()}
      >
        <img
          src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
          alt="Previous slide"
        ></img>
      </div>
      <div
        className="feedback-arrow-next"
        onClick={() => sliderRef.current?.slickNext?.()}
      >
        <img
          src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
          alt="Next slide"
        ></img>
      </div>
      <div className="yesssss" style={{ marginLeft: "15px" }}>
        <Slider {...settings} ref={sliderRef}>
          {testimonial?.map((tes, index) => {
            return (
              <div className="feedback-card" key={index}>
                <div>
                  <div>
                    <p>{tes?.name}</p>
                    <p>{tes?.occupation}</p>
                  </div>
                </div>
                <p className="feedback-sub-text">{tes?.review}</p>
              </div>
            );
          })}
        </Slider>
      </div>
      <style jsx>{`
        .feedback-main { width: 100%; height: auto; padding: 0px 10px; padding-top: 45px; padding-bottom: 66px; position: relative; }

        .feedback-arrow-prev { position: absolute; margin-top: 130px !important; z-index: 2; margin-left: -45px; font-size: 10px; background-color: #f5f5f5; padding: 17px 22px; cursor: pointer; border-radius: 50%; }
        .feedback-arrow-prev img { width: 20px; height: 30px; }

        .feedback-arrow-next { position: absolute; margin-top: 130px; z-index: 2; right: -20px; background-color: #f5f5f5; padding: 17px 22px; cursor: pointer; border-radius: 50%; }
        .feedback-arrow-next img { width: 20px; height: 30px; }

        .feedback-card { width: 90% !important; height: auto; padding: 20px; min-height: 230px; border-radius: 10px; box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px; background-color: white; }
        .feedback-card > div:first-child { width: 100%; height: auto; display: flex; align-items: center; justify-content: center; }
        .feedback-card > div:first-child img { width: 50px; height: 50px; border-radius: 50%; }
        .feedback-card > div:first-child > div { padding-left: 20px; }
        .feedback-card > div:first-child > div p:first-child { font-family: "Montserrat"; font-size: 16px; color: #3a5ba2; font-weight: 700; text-transform: capitalize; margin-bottom: 0px; }
        .feedback-card > div:first-child > div p:nth-child(2) { font-family: "Montserrat"; font-size: 13px; color: gray; font-weight: 500; text-transform: capitalize; margin-top: 0px; }

        .feedback-sub-text { font-family: "Montserrat"; font-size: 14px; color: #000; text-align: justify; }

        @media (max-width: 1024px) and (min-width: 768px) {
          .feedback-main { width: 100%; height: auto; margin-top: 60px; padding: 0px 40px; }
          .feedback-arrow-prev { display: none; }
          .feedback-arrow-next { display: none !important; }
          .feedback-card { width: 90% !important; }
        }

        @media (max-width: 767px) and (min-width: 321px) {
          .feedback-main { width: 100%; height: auto; margin-top: 0px; padding: 30px 0px; }
          .feedback-arrow-prev { display: none !important; }
          .feedback-arrow-next { display: none !important; }
          .feedback-card { width: 86% !important; padding: 10px !important; margin-left: 23px !important; }
        }

        @media (max-width: 320px) {
          .feedback-main { width: 100%; height: auto; margin-top: 60px; padding: 30px 10px; }
          .feedback-arrow-prev { display: none !important; }
          .feedback-arrow-next { display: none !important; }
          .feedback-card { width: 100% !important; padding: 20px !important; }
          .feedback-sub-text { font-size: 12px; }
        }
      `}</style>
    </div>
  );
};

export default Feedback;
