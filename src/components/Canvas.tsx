import { CSSProperties, useContext, useEffect, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import ImageContext from "../Context";

function Canvas() {
  const { images, config, setImages } = useContext(ImageContext)!;

  const [style, setStyle] = useState({});
  const [imgStyle, setImgStyle] = useState({});

  useEffect(() => {
    const { mode, spacing, border } = config;
    const style: CSSProperties = {};
    if (mode === "vertical") {
      style.display = "flex";
      style.flexDirection = "column";
      style.flexWrap = "nowrap";
      style.width = "300px";
    } else if (mode === "horizontal") {
      style.display = "flex";
      style.flexWrap = "nowrap";
    } else {
      style.display = "grid";
      style.gridTemplateColumns = `repeat(${
        config.columns || 1
      }, minmax(300px, 1fr))`;
    }
    if (!spacing) {
      style.fontSize = 0;
      if (mode === "multipleColumns") {
        config.columns = config.columns || 1;
        style.width = 300 * config.columns;
        style.gap = "0";
      }
    } else {
      style.gap = "5px";
      if (mode === "multipleColumns") {
        config.columns = config.columns || 1;
        style.width = 300 * config.columns + 5 * (config.columns - 1);
      }
    }

    if (border) {
      setImgStyle({
        boxSizing: "border-box",
        border: `${config.borderWidth}px solid #666`,
      });
    } else {
      setImgStyle({});
    }
    setStyle(style);
  }, [config]);

  return (
    <ReactSortable<any>
      id="canvas"
      list={images}
      setList={setImages}
      animation={150}
      style={style}
    >
      {images.map((image) => (
        <img
          key={image.uid}
          className="img"
          src={image.url}
          alt=""
          style={imgStyle}
        />
      ))}
    </ReactSortable>
  );
}

export default Canvas;
