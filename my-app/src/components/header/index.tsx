import { Card } from "../card";
import { CardButton } from "../card-button";

export function Header({children}: {children?: React.ReactNode}) {
  return (
    <header>
      <div className="w-full flex p-5 gap-3 justify-center items-center bg-background-surface
      ">
          <p className=" text-text-high text-md font-bold">Logo</p>
          <Card title="Total Tracks:" counter="3">
            {children}
            </Card>

            <CardButton icon={"music"} />
      </div>
    </header>
  );
}