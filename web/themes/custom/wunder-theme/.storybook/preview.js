/** @type { import('@storybook/server').Preview } */

// FONTS
import '../libraries/fonts/fonts.css';
import './storybook.css';

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
