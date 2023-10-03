import { RotateRightOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
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
      style.width = "max-content";
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

  const [rotateRightMap, setRotateRightMap] = useState<Record<string, number>>(
    {},
  );

  const onRotateRight = (image: UploadFile) => {
    const rotateRight = rotateRightMap[image.uid] || 0;
    setRotateRightMap({
      ...rotateRightMap,
      [image.uid]: (rotateRight + 1) % 4,
    });
  };

  return (
    <ReactSortable<any>
      id="canvas"
      list={images}
      setList={setImages}
      animation={150}
      style={style}
    >
      {images.map((image) => (
        <div key={image.uid} className="image">
          <img
            className="image-img"
            key={image.uid}
            src={image.url}
            alt=""
            style={{
              ...imgStyle,
              transform: `rotate(${(rotateRightMap[image.uid] || 0) * 90}deg)`,
            }}
          />
          <div className="image-mask">
            <div className="image-mask-info">
              <Button
                type="link"
                icon={<RotateRightOutlined />}
                size="large"
                onClick={onRotateRight.bind(null, image)}
              />
            </div>
          </div>
        </div>
      ))}
    </ReactSortable>
  );
}

export default Canvas;
