import { Card } from "../card";
import { CardButton } from "../card-button";
import { cardButtonVariants } from "../card-button/styles";
export function Header({children}: {children?: React.ReactNode}, variant: 'primary' | 'secondary' = 'primary') {
  return (
    <header>
      <div className="w-full flex p-5 gap-3 justify-center items-center bg-background-surface
      ">
          <p className=" text-text-high text-md font-bold">Logo</p>
          
          <Card title="Total Tracks:" counter="3">
            {children}
            </Card>

            <CardButton icon={"download"} variant={variant} />
            <CardButton icon={"profile"} img="https://github.com/thayy29.png" title="Thayana" subTitle="Pro account" iconButton={true} variant="secondary"/>
      
      </div>
    </header>
  );
}