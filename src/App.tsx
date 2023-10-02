import {ImageContextWrapper} from "./Context";
import Canvas from "./components/Canvas";
import Config from "./components/Config";

function App () {
  return (
    <ImageContextWrapper>
      <Canvas />
      <Config />
    </ImageContextWrapper>
  )
}

export default App;
