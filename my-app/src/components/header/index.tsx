import { Card } from "../card";
import { CardButton } from "../card-button";
import { Logo } from "../global/Logo";
import { IoDownload } from "react-icons/io5";

interface HeaderProps {
  totalTracks?: number;
}

export function Header({ totalTracks = 0 }: HeaderProps) {
  return (
    <header>
      <div className="w-full flex p-5 gap-3 justify-between items-center bg-background-surface">
        <Logo />
        <div className="flex gap-2 items-center">
          <Card title="Total Tracks:" counter={totalTracks} />
          <button className="flex items-center gap-2 px-4 py-2 bg-action-primary text-black rounded-lg text-sm font-semibold hover:bg-action-primaryHover transition-colors">
            <IoDownload size={16} />
            Download All
          </button>
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