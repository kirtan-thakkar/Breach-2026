import Container from "./Container";
import {
  IconHome,
  IconBolt,
  IconProgressCheck,
  IconDeviceImac,
} from "@tabler/icons-react";
import { motion } from "motion/react";
const ChoosePage = () => {
  const whyChooseGrid = [
    {
      img: <IconHome size={40} />,
      title: "Dynamic Email Templating",
      description:
        "Generate realistic phishing emails that adapt to campaign context, communication style, and department tone.",
    },
    {
      img: <IconBolt size={40} />,
      title: "Behavior Tracking",
      description:
        "Capture critical events including link clicks, credential attempts, response actions, and timestamps.",
    },
    {
      img: <IconProgressCheck size={40} />,
      title: "Centralized Risk Analytics",
      description:
        "Measure phishing click rates, credential submission rates, and vulnerability metrics across departments.",
    },
    {
      img: <IconDeviceImac size={40} />,
      title: "Peer Benchmarking Reports",
      description:
        "Compare awareness performance against anonymous industry averages to guide targeted training decisions.",
    },
  ];
  return (
    <div>
      <Container>
        <div className="py-30 mt-10  flex flex-col items-center gap-4">
          <motion.div
          initial={{
            opacity:0,
            y:5,
            filter:"blur(10px)",
          }}
          whileInView={{
            opacity:1,
            y:0,
            filter:"blur(0px)",
          }}
          transition={{
            duration:0.3,
            delay:0.3,
            ease:"easeInOut"
          }}
          >
            <h1 className="text-primary tracking-tighter text-5xl font-medium">
              Why Security Teams Choose Breach 2026
            </h1>
          </motion.div>
          <motion.div
          initial={{
            opacity:0,
            y:5,
            filter:"blur(10px)",
          }}
          whileInView={{
            opacity:1,
            y:0,
            filter:"blur(0px)",
          }}
          transition={{
            duration:0.3,
            delay:0.5,
            ease:"easeInOut"
          }}
          >
            <p className="text-md text-neutral-500 font-medium text-center">
              Built for real-world phishing simulation campaigns,<br></br>
              measurable behavior tracking, and actionable awareness insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 w-full md:grid-cols-2 xl:grid-cols-4 gap-4 mt-10">
            {whyChooseGrid.map((item, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 20,
                  filter: "blur(10px)",
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.15,
                  ease: "easeInOut"
                }}
                className="w-full"
              >
                <div className="h-full rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-aceternity backdrop-blur-sm transition-colors duration-300 hover:border-amber-300 flex flex-col items-start gap-4">
                  <div className="flex items-center justify-center rounded-[50%] border border-neutral-300 size-16 text-neutral-600">
                    {item.img}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <h4 className="text-primary text-xl tracking-tight font-medium">{item.title}</h4>
                    <p className="text-neutral-600 font-medium leading-6">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
export default ChoosePage;
