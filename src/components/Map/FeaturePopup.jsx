import { Descriptions, Typography, Empty } from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

const FeaturePopup = ({ properties }) => {
  if (!properties || Object.keys(properties).length === 0) {
    return <Empty description="Tidak ada data" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  // Filter out internal properties if any (like style related ones we added)
  const displayProps = Object.entries(properties).filter(([key]) => {
    // Filter out style properties we might have added in Maps.jsx
    const styleKeys = ['stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'dashArray', 'icon'];
    return !styleKeys.includes(key);
  });

  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', minWidth: '250px' }}>
      <Descriptions column={1} size="small" bordered>
        {displayProps.map(([key, value]) => (
          <Descriptions.Item key={key} label={<Text strong>{key}</Text>}>
            {value === null || value === undefined ? '-' : value.toString()}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

FeaturePopup.propTypes = {
  properties: PropTypes.object
};

export default FeaturePopup;
