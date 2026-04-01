---
name: weather-hcmc
description: Sử dụng terminal để kiểm tra thời tiết hiện tại ở Thành phố Hồ Chí Minh (Ho Chi Minh City) hôm nay. Dùng wttr.in API qua curl để lấy dữ liệu thời tiết.
---

# Check Weather in Ho Chi Minh City

Perform the following steps to get the current weather in Ho Chi Minh City:

1. **Fetch weather data** using `curl` and the free wttr.in API:
   ```bash
   curl -s "wttr.in/Ho+Chi+Minh+City?format=4"
   ```

2. **For detailed weather**, use:
   ```bash
   curl -s "wttr.in/Ho+Chi+Minh+City?lang=vi"
   ```

3. **Present the results** to the user in a clear, readable format including:
   - Current temperature (°C)
   - Weather condition (sunny, cloudy, rain, etc.)
   - Humidity
   - Wind speed
   - Forecast for the rest of the day if available

4. If `curl` is not available, try using `wget` or `fetch` as alternatives.

5. Always display the time the weather was retrieved so the user knows how current the data is.
