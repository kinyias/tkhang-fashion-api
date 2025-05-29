const elasticsearchClient = require('../config/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.indexName = 'products_index';
  }

  // Enhanced index == database creation with Vietnamese support
  async createIndex() {
    try {
      const exists = await elasticsearchClient.indices.exists({
        index: this.indexName
      });

      if (!exists.body) {
        await elasticsearchClient.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                // Custom analyzers for Vietnamese text
                analyzer: {
                  vietnamese_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                      'lowercase',
                      'asciifolding',  // Converts "Áo" to "ao"
                      'vietnamese_stop',
                      'vietnamese_synonym'
                    ]
                  },
                  vietnamese_search: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                      'lowercase',
                      'asciifolding',
                      'vietnamese_stop'
                    ]
                  },
                  autocomplete_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                      'lowercase',
                      'asciifolding',
                      'edge_ngram_filter'
                    ]
                  }
                },
                filter: {
                  vietnamese_stop: {
                    type: 'stop',
                    stopwords: ['của', 'và', 'có', 'là', 'được', 'cho', 'từ', 'với', 'này', 'đó', 'các', 'một', 'để', 'như', 'đã', 'sẽ', 'bị', 'khi', 'nếu', 'thì', 'nhưng', 'mà', 'tại', 'về', 'theo', 'sau', 'trước', 'trong', 'ngoài', 'trên', 'dưới']
                  },
                  vietnamese_synonym: {
                    type: 'synonym',
                    synonyms: [
                      'áo,ao',
                      'quần,quan', 
                      'giày,giay',
                      'tất,vớ,tat,vo',
                      'dài,maxi,lửng,dai,lung,',
                      'họa tiết,hoa văn,in,thêu,kẻ sọc,caro,chấm bi,hoa tiet,hoa van,in,theu,ke soc,caro,cham bi',
                      'trơn,không họa tiết, một màu,tron,khong hoa tiet,mot mau',
                      'đơn giản,basic,trơn,tron,don gian',
                      'ôm bodycon,slim fit,ôm sát,om,bodycon,slim fit,om sat',
                      'túi,tui',
                      'phụ kiện,phukien',
                    ]
                  },
                  edge_ngram_filter: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20
                  }
                }
              }
            },
            mappings: {
              properties: {
                ma: { type: 'integer' },
                ten: {
                  type: 'text',
                  analyzer: 'vietnamese_analyzer',
                  search_analyzer: 'vietnamese_search',
                  fields: {
                    keyword: { type: 'keyword' },
                    autocomplete: {
                      type: 'text',
                      analyzer: 'autocomplete_analyzer',
                      search_analyzer: 'vietnamese_search'
                    },
                    raw: {
                      type: 'text',
                      analyzer: 'standard'
                    }
                  }
                },
                mota: {
                  type: 'text',
                  analyzer: 'vietnamese_analyzer',
                  search_analyzer: 'vietnamese_search'
                },
                giaban: { type: 'double' },
                giagiam: { type: 'double' },
                hinhanh: { type: 'keyword' },
                noibat: { type: 'boolean' },
                trangthai: { type: 'boolean' },
                madanhmuc: { type: 'integer' },
                maloaisanpham: { type: 'integer' },
                mathuonghieu: { type: 'integer' },
                danhmuc_ten: {
                  type: 'text',
                  analyzer: 'vietnamese_analyzer',
                  search_analyzer: 'vietnamese_search',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                loaisanpham_ten: {
                  type: 'text',  
                  analyzer: 'vietnamese_analyzer',
                  search_analyzer: 'vietnamese_search',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                thuonghieu_ten: {
                  type: 'text',
                  analyzer: 'vietnamese_analyzer', 
                  search_analyzer: 'vietnamese_search',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                mamausac: { type: 'integer' },
                makichco: { type: 'integer' },
                danhgia_trungbinh: { type: 'float' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' }
              }
            }
          }
        });
        console.log('Vietnamese-enabled Elasticsearch index created successfully');
        return true;
      } else {
        console.log('Elasticsearch index already exists');
        return false;
      }
    } catch (error) {
      console.error('Error creating Elasticsearch index:', error);
      throw error;
    }
  }

  // Check if index exists and create if not
  async ensureIndexExists() {
    try {
      const exists = await elasticsearchClient.indices.exists({
        index: this.indexName
      });
      
      if (!exists.body) {
        console.log('Index does not exist, creating...');
        await this.createIndex();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking index existence:', error);
      throw error;
    }
  }

  // Index a single product
  async indexProduct(sanPham) {
    try {
      await this.ensureIndexExists();

      const doc = {
        ma: sanPham.ma,
        ten: sanPham.ten,
        mota: sanPham.mota,
        giaban: sanPham.giaban,
        giagiam: sanPham.giagiam,
        hinhanh: sanPham.hinhanh,
        noibat: sanPham.noibat,
        trangthai: sanPham.trangthai,
        madanhmuc: sanPham.madanhmuc,
        maloaisanpham: sanPham.maloaisanpham,
        mathuonghieu: sanPham.mathuonghieu,
        danhmuc_ten: sanPham.danhMuc?.ten,
        loaisanpham_ten: sanPham.loaiSanPham?.ten,
        thuonghieu_ten: sanPham.thuongHieu?.ten,
        mamausac: sanPham.bienThes ? [...new Set(sanPham.bienThes.map(bt => bt.mamausac))] : [],
        makichco: sanPham.bienThes ? [...new Set(sanPham.bienThes.map(bt => bt.makichco))] : [],
        danhgia_trungbinh: sanPham.danhgia_trungbinh || 0,
        created_at: sanPham.created_at || new Date(),
        updated_at: sanPham.updated_at || new Date()
      };

      await elasticsearchClient.index({
        index: this.indexName,
        id: sanPham.ma,
        body: doc,
        refresh: 'wait_for'
      });
    } catch (error) {
      console.error('Error indexing product:', error);
      throw error;
    }
  }

  // Bulk index products
  async bulkIndexProducts(sanPhams) {
    try {
      await this.ensureIndexExists();

      const body = [];
      
      sanPhams.forEach(sanPham => {
        body.push({
          index: {
            _index: this.indexName,
            _id: sanPham.ma
          }
        });
        
        body.push({
          ma: sanPham.ma,
          ten: sanPham.ten,
          mota: sanPham.mota,
          giaban: sanPham.giaban,
          giagiam: sanPham.giagiam,
          hinhanh: sanPham.hinhanh,
          noibat: sanPham.noibat,
          trangthai: sanPham.trangthai,
          madanhmuc: sanPham.madanhmuc,
          maloaisanpham: sanPham.maloaisanpham,
          mathuonghieu: sanPham.mathuonghieu,
          danhmuc_ten: sanPham.danhMuc?.ten,
          loaisanpham_ten: sanPham.loaiSanPham?.ten,
          thuonghieu_ten: sanPham.thuongHieu?.ten,
          mamausac: sanPham.bienThes ? [...new Set(sanPham.bienThes.map(bt => bt.mamausac))] : [],
          makichco: sanPham.bienThes ? [...new Set(sanPham.bienThes.map(bt => bt.makichco))] : [],
          danhgia_trungbinh: sanPham.danhgia_trungbinh || 0,
          created_at: sanPham.created_at || new Date(),
          updated_at: sanPham.updated_at || new Date()
        });
      });

      const response = await elasticsearchClient.bulk({
        refresh: 'wait_for',
        body
      });

      if (response.body.errors) {
        console.error('Bulk indexing errors:', response.body.items);
        response.body.items.forEach((item, index) => {
          if (item.index && item.index.error) {
            console.error(`Error indexing item ${index}:`, item.index.error);
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error bulk indexing products:', error);
      throw error;
    }
  }

  // Enhanced search with multiple query strategies
  async advancedSearch(filters = {}, page = 1, limit = 10, sortBy = 'ma', sortOrder = 'desc') {
    try {
      await this.ensureIndexExists();

      const from = (page - 1) * limit;
      
      // Build comprehensive search query
      const query = {
        bool: {
          must: [],
          should: [],
          filter: [],
          minimum_should_match: 0
        }
      };

      // Enhanced text search with multiple strategies
      if (filters.search) {
        const searchTerm = filters.search.trim();
        
        // Strategy 1: Multi-match with boosting
        query.bool.should.push({
          multi_match: {
            query: searchTerm,
            fields: [
              'ten^3',                    // Highest boost for product name
              'ten.autocomplete^2',       // Autocomplete field
              'mota^1.5',                // Description
              'danhmuc_ten^2',           // Category name
              'loaisanpham_ten^2',       // Product type
              'thuonghieu_ten^1.5'       // Brand name
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or',
            boost: 3
          }
        });

        // Strategy 2: Phrase matching (exact phrases get higher score)
        query.bool.should.push({
          multi_match: {
            query: searchTerm,
            fields: ['ten^2', 'mota', 'danhmuc_ten', 'loaisanpham_ten'],
            type: 'phrase',
            boost: 2
          }
        });

        // Strategy 3: Prefix matching for autocomplete
        query.bool.should.push({
          multi_match: {
            query: searchTerm,
            fields: ['ten.autocomplete^1.5'],
            type: 'phrase_prefix',
            boost: 1.5
          }
        });

        // Strategy 4: Wildcard search for partial matches
        if (searchTerm.length >= 2) {
          query.bool.should.push({
            wildcard: {
              'ten': {
                value: `*${searchTerm.toLowerCase()}*`,
                boost: 1
              }
            }
          });
        }

        // Set minimum should match when search is present
        query.bool.minimum_should_match = 1;
      }

      // Apply filters (same as before)
      if (filters.madanhmuc && filters.madanhmuc.length > 0) {
        query.bool.filter.push({
          terms: {
            madanhmuc: filters.madanhmuc.map(id => Number(id))
          }
        });
      }

      if (filters.maloaisanpham && filters.maloaisanpham.length > 0) {
        query.bool.filter.push({
          terms: {
            maloaisanpham: filters.maloaisanpham.map(id => Number(id))
          }
        });
      }

      if (filters.mathuonghieu && filters.mathuonghieu.length > 0) {
        query.bool.filter.push({
          terms: {
            mathuonghieu: filters.mathuonghieu.map(id => Number(id))
          }
        });
      }

      if (filters.mamausac && filters.mamausac.length > 0) {
        query.bool.filter.push({
          terms: {
            mamausac: filters.mamausac.map(id => Number(id))
          }
        });
      }

      if (filters.makichco && filters.makichco.length > 0) {
        query.bool.filter.push({
          terms: {
            makichco: filters.makichco.map(id => Number(id))
          }
        });
      }

      if (filters.minPrice || filters.maxPrice) {
        const priceRange = {};
        if (filters.minPrice) priceRange.gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) priceRange.lte = parseFloat(filters.maxPrice);
        
        query.bool.filter.push({
          range: {
            giaban: priceRange
          }
        });
      }

      if (filters.noibat !== undefined) {
        query.bool.filter.push({
          term: {
            noibat: filters.noibat === 'true'
          }
        });
      }

      if (filters.trangthai !== undefined) {
        query.bool.filter.push({
          term: {
            trangthai: filters.trangthai === 'true'
          }
        });
      }

      // Enhanced sorting with relevance consideration
      const sort = [];
      
      // If there's a search query, prioritize relevance
      if (filters.search) {
        sort.push({ _score: { order: 'desc' } });
      }
      
      // Then apply user-specified sorting
      const sortFieldMap = {
        'ma': 'ma',
        'ten': 'ten.keyword',
        'giaban': 'giaban',
        'giagiam': 'giagiam',
        'danhgia_trungbinh': 'danhgia_trungbinh',
        'created_at': 'created_at',
        'updated_at': 'updated_at'
      };
      
      let sortField = sortFieldMap[sortBy] || 'ma';
      const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
      
      sort.push({ [sortField]: { order: validSortOrder } });

      // Execute search with highlight for search terms
      const searchBody = {
        query: (query.bool.must.length === 0 && query.bool.should.length === 0 && query.bool.filter.length === 0) 
          ? { match_all: {} } 
          : query,
        sort: sort,
        from: from,
        size: limit,
        _source: true
      };

      // Add highlighting for search results
      if (filters.search) {
        searchBody.highlight = {
          fields: {
            'ten': {},
            'mota': {},
            'danhmuc_ten': {},
            'loaisanpham_ten': {},
            'thuonghieu_ten': {}
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          fragment_size: 150,
          number_of_fragments: 3
        };
      }

      const searchResponse = await elasticsearchClient.search({
        index: this.indexName,
        body: searchBody
      });

      const hits = searchResponse.body.hits;
      const totalCount = hits.total.value;
      const products = hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score,
        _highlights: hit.highlight || {}
      }));

      return {
        data: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        searchMeta: {
          took: searchResponse.body.took,
          maxScore: hits.max_score,
          hasSearch: !!filters.search
        }
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw error;
    }
  }

  // Get search suggestions for autocomplete
  async getSearchSuggestions(query, limit = 5) {
    try {
      await this.ensureIndexExists();

      const searchResponse = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['ten.autocomplete^2', 'danhmuc_ten', 'thuonghieu_ten'],
              type: 'phrase_prefix'
            }
          },
          _source: ['ten', 'danhmuc_ten', 'thuonghieu_ten'],
          size: limit
        }
      });

      return searchResponse.body.hits.hits.map(hit => ({
        text: hit._source.ten,
        category: hit._source.danhmuc_ten,
        brand: hit._source.thuonghieu_ten,
        score: hit._score
      }));
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  // Test analyzer (useful for debugging Vietnamese text processing)
//   async testAnalyzer(text, analyzer = 'vietnamese_analyzer') {
//     try {
//       const response = await elasticsearchClient.indices.analyze({
//         index: this.indexName,
//         body: {
//           analyzer: analyzer,
//           text: text
//         }
//       });
//       return response.body.tokens;
//     } catch (error) {
//       console.error('Error testing analyzer:', error);
//       throw error;
//     }
//   }

  // Delete product from index
  async deleteProduct(productId) {
    try {
      await elasticsearchClient.delete({
        index: this.indexName,
        id: productId,
        refresh: 'wait_for'
      });
    } catch (error) {
      if (error.statusCode !== 404) {
        console.error('Error deleting product from Elasticsearch:', error);
        throw error;
      }
    }
  }

  // Update product in index
  async updateProduct(productId, updateData) {
    try {
      await elasticsearchClient.update({
        index: this.indexName,
        id: productId,
        body: {
          doc: updateData
        },
        refresh: 'wait_for'
      });
    } catch (error) {
      console.error('Error updating product in Elasticsearch:', error);
      throw error;
    }
  }

  // Delete and recreate index
  async recreateIndex() {
    try {
      const exists = await elasticsearchClient.indices.exists({
        index: this.indexName
      });
      
      if (exists.body) {
        await elasticsearchClient.indices.delete({
          index: this.indexName
        });
        console.log('Existing index deleted');
      }
      
      await this.createIndex();
      console.log('Index recreated successfully');
    } catch (error) {
      console.error('Error recreating index:', error);
      throw error;
    }
  }

  // Get index mapping
  async getIndexMapping() {
    try {
      const response = await elasticsearchClient.indices.getMapping({
        index: this.indexName
      });
      return response.body;
    } catch (error) {
      console.error('Error getting index mapping:', error);
      throw error;
    }
  }
}

module.exports = new ElasticsearchService();