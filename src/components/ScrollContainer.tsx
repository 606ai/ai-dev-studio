import React, { FC, ReactNode, useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Fab, 
  Zoom, 
  useScrollTrigger, 
  Tooltip 
} from '@mui/material';
import { 
  KeyboardArrowUp as KeyboardArrowUpIcon, 
  KeyboardArrowDown as KeyboardArrowDownIcon 
} from '@mui/icons-material';

interface ScrollContainerProps {
  children: ReactNode;
  scrollThreshold?: number;
}

export const ScrollContainer: FC<ScrollContainerProps> = ({ 
  children, 
  scrollThreshold = 20 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleScrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  const checkScrollPosition = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Check for scroll to top
    setShowScrollTop(scrollTop > scrollThreshold);
    
    // Check for scroll to bottom
    setShowScrollBottom(
      scrollHeight > clientHeight && 
      scrollTop + clientHeight < scrollHeight - scrollThreshold
    );
  };

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        height: '100%', 
        overflow: 'hidden' 
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          paddingRight: '10px', // Space for scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
        onScroll={checkScrollPosition}
      >
        {children}
      </Box>

      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Tooltip title="Scroll to Top">
          <Fab
            color="primary"
            size="small"
            onClick={handleScrollToTop}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Scroll to Bottom Button */}
      <Zoom in={showScrollBottom}>
        <Tooltip title="Scroll to Bottom">
          <Fab
            color="secondary"
            size="small"
            onClick={handleScrollToBottom}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 80,
              zIndex: 1000,
            }}
          >
            <KeyboardArrowDownIcon />
          </Fab>
        </Tooltip>
      </Zoom>
    </Box>
  );
};

export default ScrollContainer;
