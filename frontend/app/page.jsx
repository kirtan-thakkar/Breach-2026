import Container from "@/components/Container";
import HeroPage from "@/components/Hero";
import Image from "next/image";

export default function Home() {
  return (
    <div className="py-10">
      <Container>
        <section>
          <HeroPage />  
        </section>
         </Container>
    </div>
  );
}
