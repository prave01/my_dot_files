return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
    "MunifTanjim/nui.nvim",
  },
  lazy = false,
  config = function()
    require("neo-tree").setup({})
    vim.keymap.set("n", "<leader>e", ":Neotree source=filesystem reveal=true position=right toggle<CR>", {})
  end,
}
