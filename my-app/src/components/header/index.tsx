import {colorTokens } from '../../styles/color-tokens';

export function Header(){
  return (
    <header>
    <div className="w-full p-2" style={{backgroundColor: colorTokens.action.primary}}>
      <h1 className="text-white text-2xl">My App Header</h1>
    </div>
    </header>

  );
}