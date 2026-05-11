/**
 * @module HolidayCalendar
 * @description Holiday calendar display component.
 */
import { Calendar, Space, Tag, Tooltip } from 'antd';

export default function HolidayCalendar({ holidays = [], onSelectHoliday }) {
  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return holidays.filter(h => h.date === dateStr);
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    const visibleItems = listData.slice(0, 2);
    const hiddenCount = Math.max(listData.length - visibleItems.length, 0);

    return (
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        {visibleItems.map((item) => (
          <Tooltip key={item.id} title={`${item.name}${item.branchName ? ` - ${item.branchName}` : ' - All branches'}`}>
            <Tag
              color={item.branchId ? 'blue' : 'green'}
              style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectHoliday?.(item);
              }}
            >
              {item.name}
            </Tag>
          </Tooltip>
        ))}
        {hiddenCount > 0 ? <Tag>+{hiddenCount} more</Tag> : null}
      </Space>
    );
  };

  return <Calendar cellRender={dateCellRender} />;
}
