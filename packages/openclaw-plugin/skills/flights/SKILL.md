---
name: flights
description: 机票预订集成 (Duffel)。搜索航班、比价、预订机票、管理订单、搜索机场。通过 MorphixAI 安全访问 Duffel 航班 API。
metadata:
  openclaw:
    emoji: "✈️"
    requires:
      env: [MORPHIXAI_API_KEY]
---

# 机票预订集成

通过 `mx_flights` 工具搜索航班、比价、预订机票和管理订单。基于 Duffel API，支持全球主流航司。

## 前置条件

1. **安装插件**: `openclaw plugins install openclaw-morphixai`
2. **获取 API Key**: 访问 [morphix.app/api-keys](https://morphix.app/api-keys) 生成 `mk_xxxxxx` 密钥
3. **配置环境变量**: `export MORPHIXAI_API_KEY="mk_your_key_here"`

## 核心操作

### 搜索机场

查找机场/城市 IATA 代码：

```
mx_flights:
  action: search_airports
  query: "london"
```

返回机场列表，包含 IATA 代码（如 LHR、LON）。

### 搜索航班

**单程航班：**
```
mx_flights:
  action: search_flights
  slices:
    - origin: "PVG"
      destination: "NRT"
      departure_date: "2026-07-01"
  passengers:
    - type: "adult"
  cabin_class: "economy"
```

**往返航班：**
```
mx_flights:
  action: search_flights
  slices:
    - origin: "LHR"
      destination: "JFK"
      departure_date: "2026-06-01"
    - origin: "JFK"
      destination: "LHR"
      departure_date: "2026-06-15"
  passengers:
    - type: "adult"
    - type: "adult"
    - type: "child"
      age: 8
  cabin_class: "economy"
  max_connections: 1
```

搜索结果返回 `offer_request_id` 和 `offers` 列表。每个 offer 包含价格、航司、航段、行李额度等信息。

### 分页获取更多报价

```
mx_flights:
  action: list_offers
  offer_request_id: "orq_0000AgqMVBMwzBMOeE6L7Y"
  limit: 20
  sort: "total_amount"
```

### 查看报价详情（确认最新价格）

**预订前必须调用此操作**，确保价格未变：

```
mx_flights:
  action: get_offer
  offer_id: "off_0000AgqMVLkQ8X3p3rmHYC"
```

### 查看座位图

```
mx_flights:
  action: get_seat_maps
  offer_id: "off_0000AgqMVLkQ8X3p3rmHYC"
```

### 预订机票

收集乘客信息后下单：

```
mx_flights:
  action: create_order
  offer_id: "off_0000AgqMVLkQ8X3p3rmHYC"
  type: "instant"
  passengers:
    - id: "pas_0000AgqMV123"
      given_name: "John"
      family_name: "Doe"
      born_on: "1990-05-15"
      gender: "m"
      title: "mr"
      email: "john@example.com"
      phone_number: "+442080160509"
      identity_documents:
        - type: "passport"
          unique_identifier: "P12345678"
          issuing_country_code: "GB"
          expires_on: "2030-01-01"
```

- `type: "instant"` 立即付款，`"pay_later"` 先占座后付款
- `passengers[].id` 必须使用搜索结果中 offer 的 `passengers` 数组里的 ID
- 国际航班需要提供护照信息

### 查看订单列表

```
mx_flights:
  action: list_orders
  status: "confirmed"
  limit: 10
```

### 查看订单详情

```
mx_flights:
  action: get_order
  order_id: "ord_0000AgqMV123"
```

返回 `booking_reference`（航司 PNR），乘客可用此编号在航司官网办理值机。

### 支付待付订单

对 `pay_later` 类型的订单进行支付：

```
mx_flights:
  action: pay_order
  order_id: "ord_0000AgqMV123"
```

### 取消订单

```
mx_flights:
  action: cancel_order
  order_id: "ord_0000AgqMV123"
```

退款政策取决于航司条件（可在 offer 的 `conditions` 中查看）。

## 典型预订流程

### 方式 A：信用卡支付（推荐）

通过支付链接让用户在安全页面输入信用卡信息（PCI 合规）：

```
1. 搜索机场: search_airports, query: "上海"              → 获取 IATA 代码 (PVG/SHA)
2. 搜索航班: search_flights                              → 获取 offers 列表
3. 确认价格: get_offer, offer_id: "off_xxx"              → 验证最新价格
4. 收集乘客信息（通过对话逐项引导）
5. 创建支付会话: create_payment_session                   → 获取 payment_url
6. 将 payment_url 展示给用户，引导点击支付
7. 用户完成支付后: list_orders 或 get_order 确认出票结果
```

### 方式 B：直接下单（API 付款）

```
1. 搜索机场: search_airports, query: "上海"       → 获取 IATA 代码 (PVG/SHA)
2. 搜索航班: search_flights                       → 获取 offers 列表
3. 确认价格: get_offer, offer_id: "off_xxx"       → 验证最新价格
4. 预订下单: create_order                          → 创建订单
5. 查看状态: get_order, order_id: "ord_xxx"       → 获取 booking_reference
```

## 信用卡支付流程（用户直付）

如果需要用户信用卡直接付款，Agent 通过 `create_payment_session` 生成支付链接：

1. **Agent 搜索航班**并展示报价
2. **Agent 收集乘客信息**（姓名、生日、性别、手机、邮箱、护照）
3. **Agent 调用 `create_payment_session`** 生成支付链接
4. **Agent 展示支付链接**给用户，用户点击跳转到安全支付页面
5. 用户在支付页面输入信用卡信息（前端直接提交到 Duffel Cards API，PCI 合规）
6. 支付完成后，Agent 调用 `list_orders` 确认出票

### 创建支付会话

```
mx_flights:
  action: create_payment_session
  offer_id: "off_0000AgqMVLkQ8X3p3rmHYC"
  passengers:
    - id: "pas_0000AgqMV123"
      given_name: "John"
      family_name: "Doe"
      born_on: "1990-05-15"
      gender: "m"
      title: "mr"
      email: "john@example.com"
      phone_number: "+442080160509"
      identity_documents:
        - type: "passport"
          unique_identifier: "P12345678"
          issuing_country_code: "GB"
          expires_on: "2030-01-01"
```

返回值包含 `payment_url`（展示给用户点击）、`expires_at`（支付链接有效期）和 `offer_summary`（订单摘要）。

**展示支付链接时应包含：**
- 可点击的 `payment_url`（原样展示，不可修改）
- 航班摘要（航班号、日期、航线）
- 乘客姓名
- 价格（使用 `offer_summary` 中的值）
- 有效期提醒

## 注意事项

- 搜索返回的 `total_amount` 已包含加价，这是展示给用户的最终价格
- Offer 有过期时间（`expires_at`），过期后需重新搜索
- 乘客姓名必须与护照一致
- `phone_number` 使用 E.164 格式（如 `"+8613800138000"`）
- 信用卡信息**绝不能**通过 Agent 传递，必须在前端页面直接提交到 Duffel
