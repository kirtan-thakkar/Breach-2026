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
      title: "Maximum Security",
      description:
        "Your assets are protected with cutting-edge security protocols.",
    },
    {
      img: <IconBolt size={40} />,
      title: "Instant Transactions",
      description: "Execute your transactions in real-time, without delays.",
    },
    {
      img: <IconProgressCheck size={40} />,
      title: "Optimized Fees",
      description: "Benefit from some of the lowest fees on the market.",
    },
    {
      img: <IconDeviceImac size={40} />,
      title: "Premium Interface ",
      description:
        "An intuitive design that’s easy to use, even for beginners.",
    },
  ];
  return (
    <div>
      <Container>
        <div className="py-30 mt-10 h-screen flex flex-col items-center gap-4">
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
              Why Choose App-Name?
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
            <p className="text-md text-secondary font-medium text-center">
              Benefits designed to provide a seamless,<br></br> secure, and
              accessible experience for all users.
            </p>
          </motion.div>

          <div className="h-56 grid grid-cols-1 w-full md:grid-cols-4 gap-5 divide-x divide-y divide-neutral-300 border-neutral-300 mt-10 shadow-aceternity">
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
                <div className="flex divide-x flex-col items-start gap-4 ">
                  <div className="ml-2 mt-4 flex items-center justify-center  rounded-[50%] bg-neutral-200 border border-neutral-300 size-16">
                    {item.img}
                  </div>
                  <div className="px-4 flex flex-col items-start gap-2">
                    <h4 className="text-secondary font-medium">{item.title}</h4>
                    <p className="text-primary font-medium">{item.description}</p>
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
