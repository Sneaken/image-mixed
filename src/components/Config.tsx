import {
  DownloadOutlined,
  FilePdfOutlined,
  InboxOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Drawer,
  FloatButton,
  Form,
  Input,
  InputNumber,
  InputRef,
  message,
  Modal,
  Radio,
  Select,
  Upload,
  UploadProps,
} from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import copy from "copy-to-clipboard";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { useContext, useEffect, useRef, useState } from "react";
import ImageContext, { ConfigType, defaultConfig } from "../Context";
import { parseInvoicePDF } from "../utils.ts";

const widthOptions = Array.from({ length: 10 })
  .fill(null)
  .map((_, idx) => {
    return {
      label: `${idx + 1}px`,
      value: idx + 1,
    };
  });

const normFile = (
  e:
    | RcFile[]
    | {
        fileList: RcFile[];
      },
) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

function Config() {
  const { config, setConfig, setImages } = useContext(ImageContext)!;
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const border = Form.useWatch("border", form);

  const [columns, setColumns] = useState(1);
  const [columnsOpen, setColumnsOpen] = useState(false);

  useEffect(() => {
    if (config.mode === "multipleColumns" && config.columns !== columns) {
      // 初始化
      setColumns(config.columns);
    }
  }, [config.columns]);

  const handleValuesChange = (
    changedValues: {
      images: string[];
    },
    values: ConfigType,
  ) => {
    if ("images" in changedValues) {
      setImages(changedValues.images as unknown as UploadFile[]);
    } else {
      if (values.mode === "multipleColumns") {
        values.columns = columns;
      }
      if (!values.width) {
        values.width = defaultConfig.width;
      }
      if (!values.height) {
        values.width = defaultConfig.width;
      }
      setConfig(values);
    }
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url!);
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1),
    );
  };

  const handleCancel = () => setPreviewOpen(false);
  const handleDownload = async () => {
    const el = document.getElementById("canvas")!;
    const canvas = await html2canvas(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      backgroundColor: "transparent",
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${Date.now()}.png`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const [renameOpen, setRenameOpen] = useState(false);

  const [pdfs, setPdfs] = useState<any[]>([]);

  const props: UploadProps = {
    fileList: pdfs,
    multiple: true,
    beforeUpload: () => {
      return false;
    },
    onChange(info) {
      setPdfs(info.fileList);
    },
  };

  const inputRef = useRef<InputRef | null>(null);

  return (
    <>
      <FloatButton.Group shape="square">
        <FloatButton icon={<SettingOutlined />} onClick={() => setOpen(true)} />
        <FloatButton icon={<DownloadOutlined />} onClick={handleDownload} />
        <FloatButton
          icon={<FilePdfOutlined />}
          onClick={() => setRenameOpen(true)}
        />
      </FloatButton.Group>
      <Drawer
        title="合并选项"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
      >
        <Form
          form={form}
          labelCol={{ span: 6 }}
          onValuesChange={handleValuesChange}
          initialValues={config}
        >
          <Form.Item label="合并方式" name="mode">
            <Radio.Group>
              <Radio value="vertical">纵向</Radio>
              <Radio value="horizontal">水平</Radio>
              <Radio
                value="multipleColumns"
                onClick={() => {
                  setColumnsOpen(true);
                }}
              >
                多列
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="图片间距" name="spacing">
            <Radio.Group>
              <Radio value={0}>无间距</Radio>
              <Radio value={1}>有间距</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="图片边框" name="border">
            <Radio.Group>
              <Radio value={0}>无边框</Radio>
              <Radio value={1}>有边框</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="边框宽度" name="borderWidth">
            <Select options={widthOptions} disabled={border === 0} />
          </Form.Item>
          <Form.Item label="图片宽度" name="width">
            <InputNumber min={1} precision={0} />
          </Form.Item>
          <Form.Item label="图片高度" name="height">
            <InputNumber min={1} precision={0} />
          </Form.Item>
          <Form.Item
            label="已添加"
            name="images"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              multiple
              showUploadList
              listType="picture-card"
              accept="image/*"
              onPreview={handlePreview}
              onRemove={(file: UploadFile) => {
                const fileList = form.getFieldValue("images");
                const index = fileList.indexOf(file);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                URL.revokeObjectURL(file.url!);
                form.setFieldValue("images", newFileList);
              }}
              beforeUpload={(file: UploadFile) => {
                if (file.type?.includes("image")) {
                  file.url = URL.createObjectURL(file as unknown as Blob);
                  const fileList = form.getFieldValue("images");
                  form.setFieldValue("images", [...fileList, file]);
                }
                return false;
              }}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
        centered
        bodyStyle={{ maxHeight: "50vh", overflow: "auto" }}
      >
        <img
          alt="image"
          style={{ width: "100%", height: "100%" }}
          src={previewImage}
        />
      </Modal>
      <Modal
        open={columnsOpen}
        title="每行放几张图片？"
        centered
        width={300}
        onOk={() => {
          setConfig({
            ...form.getFieldsValue(),
            columns,
          });
          setColumnsOpen(false);
        }}
        onCancel={() => setColumnsOpen(false)}
      >
        <InputNumber
          value={columns}
          style={{ width: "100%" }}
          onChange={(number) => setColumns(number!)}
        />
      </Modal>
      <Modal
        title="发票重命名"
        open={renameOpen}
        centered
        onCancel={() => {
          setRenameOpen(false);
          setPdfs([]);
        }}
        onOk={() => {
          if (!pdfs.length) {
            message.error("请憨批先上传发票");
            return;
          }
          Modal.confirm({
            title: "报销人姓名填写",
            centered: true,
            content: <Input ref={inputRef} />,
            onOk: async () => {
              const name = inputRef.current?.input?.value?.trim?.() || "";
              if (!name) {
                message.error("憨批先填写姓名");
                return Promise.reject();
              }
              const lines = [];
              const zip = new JSZip();
              // 遍历文件加入 ZIP
              for (const file of pdfs) {
                const arrayBuffer = await file.originFileObj.arrayBuffer();
                const { date, money, code } = await parseInvoicePDF(
                  file.originFileObj,
                );
                const filename = `${name}+${code}+${money}+${date}.pdf`;
                zip.file(filename, arrayBuffer);
                lines.push(filename);
              }
              // 生成 ZIP Blob
              const content = await zip.generateAsync({ type: "blob" });
              // 创建下载链接
              const a = document.createElement("a");
              a.href = URL.createObjectURL(content);
              a.download = `${name}-${Date.now()}-导出的发票.zip`;
              a.click();
              // 释放 URL 对象
              URL.revokeObjectURL(a.href);
              copy(lines.join("\n"), {
                onCopy: () => {
                  message.success("已将文件列表复制到剪贴板中");
                },
              });
            },
          });
        }}
        bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
      >
        <Upload.Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖动文件到此区域进行上传</p>
          <p className="ant-upload-hint">支持单个或批量上传。</p>
        </Upload.Dragger>
      </Modal>
    </>
  );
}

export default Config;
