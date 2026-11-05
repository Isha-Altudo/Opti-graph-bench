export const SIMPLE_QUERY = `
 query SimpleQuery {
  _Content(limit: 1) {
    items {
      _metadata {
        displayName
        url {
          default
        }
        types
      }
    }
    total
  }
}
`;

export const COMPLEX_QUERY = `
query getHeaderData($domain: String, $locale: [Locales!]) {
  appLayout: LayoutSettingsBlock(
    where: {
      _or: [
        { appIdentifiers: { exist: false } }
        {
          _and: [
            { appIdentifiers: { exist: true } }
            { appIdentifiers: { eq: $domain } }
          ]
        }
      ]
    }
    locale: $locale
  ) {
    items {
      _metadata {
        key
        displayName
      }

      appIdentifiers

      layoutsitelogo {
        url {
          default
        }
      }

      mainMenu {
        ...IContentData
        ...MegaMenuGroupBlockData
      }

      serviceButtons {
        ...IContentData
      }
    }
  }
}

fragment IContentData on _IContent {
  _metadata {
    key
    displayName
    types
    url {
      default
    }
  }
}

fragment LinkItemData on Link {
  title
  text
  target
  url {
    default
    base
    hierarchical
  }
}

fragment MenuNavigationBlockData on MenuNavigationBlock {
  MenuNavigationHeading
  NavigationLinks {
    ...LinkItemData
  }
}

fragment MegaMenuGroupBlockData on MegaMenuGroupBlock {
  MenuMenuHeading
  MegaMenuUrl {
    default
    base
    hierarchical
  }
  MegaMenuContentArea {
    ...IContentData
    ...MenuNavigationBlockData
  }
}
`;

export const QUERIES = {
  simple: {
    query: SIMPLE_QUERY,
    variables: {},
  },

  complex: {
    query: COMPLEX_QUERY,
    variables: {
      domain: "https://cg.optimizely.com",
      locale: ["en"],
    },
  },
} as const;

export type QueryName = keyof typeof QUERIES;
