import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Space, Table } from 'antd';
import PropTypes from 'prop-types';
import { useMemo, useRef, useState } from 'react';
import Highlighter from 'react-highlight-words';

export default function DataTable({ columns, data, loading, title = '', handleSelectedData, map = (data) => data, pagination, ...props }) {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);
  const mappedData = useMemo(() => data.map(map), [data, map]);

  const columnsWithNumber = [
    {
      title: 'No',
      dataIndex: 'index',
      render: (_, __, index) => ((pagination?.page || 1) - 1) * (pagination?.per_page || 10) + (index + 1),
      width: '5%',
      fixed: 'left'
    },
    ...columns
  ];

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex, customRender) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div
        style={{
          padding: 8
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block'
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined
        }}
      />
    ),
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      }
    },
    render: (text, record) => {
      const highlightText =
        searchedColumn === dataIndex ? (
          <Highlighter
            highlightStyle={{
              backgroundColor: '#ffc069',
              padding: 0
            }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ''}
          />
        ) : (
          text
        );

      // If there's a custom render function (like for the status), apply it here
      return customRender ? customRender(text, record) : highlightText;
    }
  });

  // Exclude the action column from search props
  const enhancedColumns = columnsWithNumber
    .filter((col) => col.searchable !== false) // Exclude non-searchable columns
    .map((col) => ({
      ...col,
      ...(col.searchable ? getColumnSearchProps(col.dataIndex, col.render) : {})
    }));

  const columnsWithTitle = title ? [{ title, children: enhancedColumns }] : enhancedColumns;

  return (
    <Table
      rowSelection={handleSelectedData ? { type: 'checkbox', onChange: handleSelectedData } : undefined}
      columns={columnsWithTitle}
      dataSource={mappedData}
      loading={loading}
      pagination={
        pagination
          ? {
              current: pagination.page,
              pageSize: pagination.per_page,
              total: pagination.totalData,
              onChange: pagination.onChange
            }
          : false
      }
      {...props}
    />
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    per_page: PropTypes.number.isRequired,
    totalData: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  }),
  title: PropTypes.string,
  handleSelectedData: PropTypes.func,
  map: PropTypes.func
};
