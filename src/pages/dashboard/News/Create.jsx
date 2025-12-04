import Modul from '@/constants/Modul';
import { useAuth, useNotification, useService } from '@/hooks';
import { NewsService } from '@/services';
import { Button, Card, Form, Input, Select, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import Dragger from 'antd/es/upload/Dragger';
import { InboxOutlined } from '@ant-design/icons';
import strings from '@/utils/strings';
import { extractUploadFile } from '@/utils/formData';

const Create = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { success, error } = useNotification();
  const storeNews = useService(NewsService.store);

  const handleEditorChange = (editor) => {
    const content = editor.getContent();
    form.setFieldsValue({ content });
  };

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <Typography.Title level={5}>Tambah {Modul.NEWS}</Typography.Title>
          <Button onClick={() => navigate(-1)} variant="solid" color="primary">
            Kembali
          </Button>
        </div>
      </Card>
      <Form
        form={form}
        className="grid w-full grid-cols-6 gap-2"
        onFinish={async (values) => {
          const payload = { ...values };
          delete payload.thumbnail;
          const fileToSend = extractUploadFile(values.thumbnail);

          const { message, isSuccess } = await storeNews.execute(payload, token, fileToSend);
          if (isSuccess) {
            success('Berhasil', message);
            navigate(-1);
          } else {
            error('Gagal', message);
          }
          return isSuccess;
        }}
      >
        <Card className="col-span-6 lg:col-span-4">
          <Form.Item
            className="mb-4"
            name="title"
            rules={[
              {
                required: true,
                message: 'Judul wajib diisi!'
              }
            ]}
          >
            <Input placeholder={`Judul ${Modul.NEWS}`} size="large" />
          </Form.Item>
          <Form.Item
            className="m-0"
            name="content"
            rules={[
              {
                required: true,
                message: 'Konten wajib diisi!'
              }
            ]}
          >
            <Editor
              apiKey="ltsdik9bjzzfm8i8g4ve5b32ii5sz0t7j6g2ag5khxm0bn1y"
              init={{
                referrer_policy: 'no-referrer',
                allow_script_urls: true,
                height: 500,
                menubar: false,
                plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
                toolbar: 'undo redo | blocks | ' + 'bold italic forecolor | alignleft aligncenter ' + 'alignright alignjustify | bullist numlist outdent indent | ' + 'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
              onInit={(evt, editor) => {
                editor.on('change', () => handleEditorChange(editor));
              }}
              onEditorChange={(content) => {
                form.setFieldsValue({ content });
              }}
            />
          </Form.Item>
        </Card>
        <Card className="col-span-6 lg:col-span-2">
          <Form.Item
            className="mb-4"
            name="status"
            rules={[
              {
                required: true,
                message: 'Status wajib diisi!'
              }
            ]}
          >
            <Select
              placeholder={`Status ${Modul.NEWS}`}
              size="large"
              options={[
                {
                  label: 'Draft',
                  value: 'draft'
                },
                {
                  label: 'Publikasi',
                  value: 'publikasi'
                }
              ]}
            />
          </Form.Item>
          <Form.Item
            className="mb-4"
            name="thumbnail"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            rules={[
              {
                required: true,
                message: 'Gambar wajib diisi!'
              }
            ]}
          >
            <Dragger
              accept={['.png', '.jpg', '.jpeg', 'webp'].join(', ')}
              name={'thumbnail'}
              maxCount={1}
              beforeUpload={() => {
                return false;
              }}
              listType="picture"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{strings('click_or_drag_file_to_this_area_to_upload')}</p>
              <p className="ant-upload-hint">{strings('accepted_file_types_s', ['.png', '.jpg', '.jpeg', 'webp'].join(', '))}</p>
            </Dragger>
          </Form.Item>
          <Form.Item className="mt-2">
            <div className="flex w-full items-center justify-end gap-x-2">
              <Button type="default" htmlType="reset" size="large">
                Reset
              </Button>
              <Button size="large" type="primary" htmlType="submit" loading={storeNews.isLoading}>
                Kirim
              </Button>
            </div>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default Create;
