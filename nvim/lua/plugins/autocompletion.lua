return {

  -- Lua snippet engine writter in Lua
  {
    "L3MON4D3/LuaSnip",
    version = "v2.*",
    dependencies = {
      "saadparwaiz1/cmp_luasnip",
      "rafamadriz/friendly-snippets",
    },
    build = "make install_jsregexp",
  },

  -- Autocompletion setup
  {
    "hrsh7th/nvim-cmp",
    config = function()
      local cmp = require("cmp")

      cmp.setup({
        formatting = {
          format = require("tailwindcss-colorizer-cmp").formatter,
        },
      })

      require("luasnip.loaders.from_vscode").lazy_load()
      cmp.setup({
        snippet = {
          -- REQUIRED - you must specify a snippet engine
          expand = function(args)
            require("luasnip").lsp_expand(args.body)
          end,
        },
        window = {
          completion = cmp.config.window.bordered(),
          documentation = cmp.config.window.bordered(),
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-b>"] = cmp.mapping.scroll_docs(-4),
          ["<C-f>"] = cmp.mapping.scroll_docs(4),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<C-e>"] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
        }),
        sources = cmp.config.sources({
          { name = "nvim_lsp" },
          { name = "luasnip" },
        }, {
          { name = "buffer" },
        }),
      })
    end,
  },

  -- Commenter
  {
    "JoosepAlviste/nvim-ts-context-commentstring",
    config = function()
      require("ts_context_commentstring").setup({
        enable_autocmd = false,
      })
    end,
  },

  {
    "monkoose/matchparen.nvim",
    config = function()
      require("matchparen").setup({
        -- Set to `false` to disable at matchpren at startup
        -- Enable matchparen manually with `:MatchParenEnable`
        enabled = true,
        -- Highlight group of the matched brackets
        -- Change it to any other or adjust colors of "MathParen" highlight group
        -- in your colorscheme to your liking
        hl_group = "MatchParen",
        -- Debounce time in milliseconds for rehighlighting brackets
        -- Set to 0 to disable debouncing
        debounce_time = 60,
      })
    end,
  },
}
