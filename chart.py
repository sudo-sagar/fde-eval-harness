import matplotlib.pyplot as plt
import numpy as np

labels = ['JSON Success Rate', 'Ground Truth Match Rate']
qwen_scores = [57, 0]
cursor_scores = [100, 100]

x = np.arange(len(labels))
width = 0.35

fig, ax = plt.subplots(figsize=(8, 5))
rects1 = ax.bar(x - width/2, qwen_scores, width, label='Local Qwen 3B', color='#ff9999')
rects2 = ax.bar(x + width/2, cursor_scores, width, label='Cursor Agent (Cloud)', color='#66b3ff')

ax.set_ylabel('Percentage (%)')
ax.set_title('Eval Harness Results: Local vs. Cursor Agent')
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.legend()
ax.set_ylim(0, 110)

def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate('{}%'.format(height),
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom')

autolabel(rects1)
autolabel(rects2)

plt.tight_layout()
plt.savefig('assets/results_chart.png', dpi=300)
print("Chart saved to assets/results_chart.png")