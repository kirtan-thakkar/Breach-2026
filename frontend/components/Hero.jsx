"use client";
import { Instrument_Serif } from "next/font/google";
import Container from "./Container";
import { RainbowButton } from "./ui/rainbow-button";
import { DM_Sans } from "next/font/google";
import { Safari } from "./ui/safari";
import { Highlighter } from "@/components/ui/highlighter";
import { motion } from "motion/react";
import ChoosePage from "./Choose";
import HowItWorks from "./HowItWorks";

const instrumentalSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const HeroPage = () => {
  return (
    <div className="py-24">
      <Container>
        <div className="flex flex-col items-center justify-center gap-6">
          <motion.div
            initial={{
              opacity: 0,
              filter: "blur(12px)",
            }}
            whileInView={{
              opacity: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            <h1
              className={`  font-medium text-6xl  tracking-tighter text-center text-primary `}
            >
              Simulate real phishing attacks <br></br>{" "}
              <Highlighter action="underline" color="#FF9800">
                AI-powered awareness{" "}
              </Highlighter>
              &nbsp;to<br></br>
              <span className={`${instrumentalSerif.className} text-7xl`}>
                reduce human risk
              </span>
            </h1>
          </motion.div>
          <motion.p
            initial={{
              opacity: 0,
              filter: "blur(12px)",
            }}
            whileInView={{
              opacity: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.3,
              delay: 0.2,
            }}
            className="text-lg text-neutral-500 text-center tracking-normal w-full max-w-xl"
          >
            Breach 2026 helps corporate security teams run phishing and social
            engineering simulations for employees and administrators. Track
            clicks, credential submission attempts, and response behavior in one
            centralized dashboard.
          </motion.p>

          <motion.div
            className="flex justify-center w-full"
            initial={{
              opacity: 0,
              filter: "blur(12px)",
            }}
            whileInView={{
              opacity: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.3,
              delay: 0.4,
            }}
          >
            <RainbowButton
              size="lg"
              variant="default"
              className={`${dmSans.className} text-lg mt-3`}
            >
              Launch a Campaign
            </RainbowButton>
          </motion.div>

          <motion.div
            initial={{
              y: 30,
              opacity: 0,
              filter: "blur(10px)",
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.3,
              delay: 0.5,
              ease: "easeInOut",
            }}
            className="w-full max-w-300 py-14"
          >
            <Safari
              url="breach2026.app/campaigns"
              imageSrc="https://placehold.co/1200x750?text=Phishing+Simulation+Analytics+Dashboard"
            />
          </motion.div>
          <motion.h2
            initial={{
              opacity: 0,
              filter: "blur(12px)",
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: "easeInOut",
            }}
            className="py-18 mt-6  text-primary text-center tracking-tighter leading-13 max-w-4xl text-5xl font-medium "
          >
            Detect phishing vulnerability before attackers do.<br></br>
            Build targeted training with<br></br> data-driven security insights.
          </motion.h2>
        </div>
        <div>
          <ChoosePage />
        </div>
        <HowItWorks />
      </Container>
    </div>
  );
};
export default HeroPage;
