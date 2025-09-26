/** @type { import('@storybook/server-webpack5').StorybookConfig } */
const config = {
  stories: [
    '../components/**/*.mdx', // Storybook home page.
    '../components/**/*.stories.@(json)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/server-webpack5',
    options: {},
  },
};
export default config;
