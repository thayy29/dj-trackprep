import { useState } from "react";
import { Card } from "../card";
import { CardButton } from "../card-button";
import { Logo } from "../logo";

export function Header(variant: 'primary' | 'secondary' = 'primary') {
    const [totalTracks, setTotalTracks ] = useState(0)

  const handleTrackConverted = () => {
    setTotalTracks((prev)=> prev + 1);
  }
  return (
    <header>
    
      <div className="w-full flex p-5 gap-3 justify-between items-center bg-background-surface
      ">
            <Logo />
            <div className="flex gap-2 items-center">
            <Card title="Total Tracks:" counter={totalTracks}/>
            <CardButton icon="download" title="Download All" variant={"primary"} />
            <CardButton 
              img="https://github.com/thayy29.png" 
              title="Thayana" 
              subTitle="Pro Account" 
              icon="profile"
              iconButton={true} 
              variant="secondary"
              size="sm"
            />

            </div>
            
      </div>
    </header>
  );
}