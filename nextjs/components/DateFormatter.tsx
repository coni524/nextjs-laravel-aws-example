interface DateFormatterProps {
    dateString: string;
    className?: string;
  }
  
  const DateFormatter: React.FC<DateFormatterProps> = ({ dateString, className }) => {
    // ISO文字列から Date オブジェクトを作成
    const date = new Date(dateString);
    
    // yyyy/MM/dd 形式にフォーマット
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
  
    return (
      <time dateTime={dateString} className={className}>
        {formatDate(date)}
      </time>
    );
  };
  
  export default DateFormatter;