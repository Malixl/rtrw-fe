import { Footer as AntdFooter } from 'antd/es/layout/layout';

const Footer = () => {
  return <AntdFooter style={{ textAlign: 'center' }}>LIX ©{new Date().getFullYear()} Created with ❤️ by Malik</AntdFooter>;
};

export default Footer;
