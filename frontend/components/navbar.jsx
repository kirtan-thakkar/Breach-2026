"use client";
import Link from "next/link";
import { motion } from "motion/react";
import Container from "./Container";

const Navbar = () => {
  return (
    <nav >
      <motion.div 
      initial={{
        opacity:0.98,
        filter:"blur(10px)",
        y:-5
      }}
      animate={{
        opacity:1,
        filter:"blur(0px)",
        y:0
      }}
      transition={{
        duration:0.3,
        ease:"easeIn"
      }}
      >
        <Container>
          <div className="flex justify-between items-center py-6 px-6 rounded-xl shadow-aceternity backdrop-blur-xl ">
            <Link href="/" className="text-primary cursor-pointer">
              {" "}
              Logo
            </Link>
            <div className="flex justify-evenly items-center gap-4">
              <Link href="/login" className="text-primary cursor-pointer">
                Login
              </Link>
              <h3 className="text-primary cursor-pointer">Link2</h3>
              <h3 className="text-primary cursor-pointer">Link3</h3>
              <h3 className="text-primary cursor-pointer">Link4</h3>
            </div>
          </div>
        </Container>
      </motion.div>
    </nav>
  );
};

export default Navbar;
