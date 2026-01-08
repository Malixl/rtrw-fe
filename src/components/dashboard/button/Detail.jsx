import { Action } from '@/constants';
import { useAuth } from '@/hooks';
import strings from '@/utils/strings';
import { InfoOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import PropTypes from 'prop-types';

export default function Detail({ title = strings('detail'), onClick, model, action = Action.READ, disabled = false, style = {} }) {
  const { user } = useAuth();
  if (action !== Action.NONE && (!user || user.cant(action, model))) return null;

  return (
    <Tooltip title={title}>
      <Button variant="outlined" color="green" onClick={onClick} size="middle" icon={<InfoOutlined />} disabled={disabled} style={style} />
    </Tooltip>
  );
}

Detail.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  model: PropTypes.func.isRequired,
  action: PropTypes.oneOf(Object.values(Action)),
  disabled: PropTypes.bool,
  style: PropTypes.object
};
