import { FC } from 'react';
import { AppBar, Toolbar, Typography, Button, styled } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)({
  position: 'relative',
  zIndex: 1,
});

const ButtonContainer = styled('div')({
  marginLeft: 'auto',
  display: 'flex',
  gap: '1rem',
});

const Header: FC = () => {
  const theme = useTheme();

  return (
    <StyledAppBar>
      <Toolbar>
        <Typography variant="h6" component="h1">
          AI Development Studio
        </Typography>
        <ButtonContainer>
          <Button variant="contained" color="secondary">
            Deploy
          </Button>
          <Button variant="contained" color="secondary">
            Debug
          </Button>
          <Button variant="contained" color="secondary">
            Run
          </Button>
        </ButtonContainer>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
