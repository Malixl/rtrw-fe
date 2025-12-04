import { DataLoader } from '@/components';
import { Button, Card, Form, Input, Select, Typography } from 'antd';
import Modul from '@/constants/Modul';
import { useAuth, useNotification, useService } from '@/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import Dragger from 'antd/es/upload/Dragger';
import { InboxOutlined } from '@ant-design/icons';
import strings from '@/utils/strings';
import { NewsService } from '@/services';
import { extractUploadFile, hasNewUploadFile } from '@/utils/formData';

const Edit = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [form] = Form.useForm();
  const { success, error } = useNotification();
  const { execute: fetchNews, ...getAllNews } = useService(NewsService.getBySlug);
  const updateNews = useService(NewsService.update);

  useEffect(() => {
    fetchNews({ slug });
  }, [fetchNews, slug]);

  const initialData = useMemo(() => {
    const news = getAllNews.data ?? {};
    return {
      ...news,
      category_id: news?.category_id?.id
    };
  }, [getAllNews.data]);

  const [realtimeData, setRealtimeData] = useState(initialData);

  useEffect(() => {
    if (!initialData?.id) return;
    form.setFieldsValue(initialData ?? {});
    setRealtimeData(initialData ?? {});
  }, [initialData, form]);

  function handleValuesChange(changedValue) {
    setRealtimeData({ ...realtimeData, ...changedValue });
  }

  const handleEditorChange = (editor) => {
    const content = editor.getContent();
    form.setFieldsValue({ content });
  };

  useEffect(() => {
    if (!initialData?.thumbnail) return;
    form.setFieldsValue({
      ...initialData,
      thumbnail: [
        {
          uid: '-1',
          name: initialData.title || 'thumbnail',
          status: 'done',
          url: initialData.thumbnail
        }
      ]
    });
  }, [initialData, form]);

  return (
    <div>
      {!getAllNews.data ? (
        <DataLoader type="datatable" />
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <Typography.Title level={5}>Edit {Modul.NEWS}</Typography.Title>
              <Button onClick={() => navigate(-1)} variant="solid" color="primary">
                Kembali
              </Button>
            </div>
          </Card>
          <Form
            form={form}
            onValuesChange={handleValuesChange}
            className="grid w-full grid-cols-6 gap-2"
            onFinish={async (values) => {
              const isFileUpdated = hasNewUploadFile(values.thumbnail);

              const payload = {
                ...values,
                _method: 'PUT'
              };

              delete payload.thumbnail;

              const fileToSend = isFileUpdated ? extractUploadFile(values.thumbnail) : null;

              const { message, isSuccess } = await updateNews.execute(initialData.id, payload, token, fileToSend);

              if (isSuccess) {
                success('Berhasil', message);
                navigate(-1);
              } else {
                error('Gagal', message);
              }

              return isSuccess;
            }}
          >
            <Card className="col-span-4">
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
            <Card className="col-span-2">
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
                  <Button size="large" type="primary" htmlType="submit" loading={updateNews.isLoading}>
                    Kirim
                  </Button>
                </div>
              </Form.Item>
            </Card>
          </Form>
        </>
      )}
    </div>
  );
};

export default Edit;
